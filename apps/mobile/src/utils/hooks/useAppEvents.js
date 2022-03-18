import NetInfo from '@react-native-community/netinfo';
import { EV, EVENTS } from 'notes-core/common';
import { useEffect, useRef } from 'react';
import {
  Appearance,
  AppState,
  Linking,
  NativeEventEmitter,
  NativeModules,
  Platform
} from 'react-native';
import * as RNIap from 'react-native-iap';
import { enabled } from 'react-native-privacy-snapshot';
import { doInBackground, editing } from '..';
import { Walkthrough } from '../../components/walkthroughs';
import {
  EditorWebView,
  getNote,
  getWebviewInit,
  updateNoteInEditor
} from '../../screens/editor/Functions';
import tiny from '../../screens/editor/tiny/tiny';
import Backup from '../../services/backup';
import BiometricService from '../../services/biometrics';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  presentSheet,
  ToastEvent
} from '../../services/event-manager';
import {
  clearMessage,
  setEmailVerifyMessage,
  setLoginMessage,
  setRecoveryKeyMessage
} from '../../services/message';
import PremiumService from '../../services/premium';
import SettingsService from '../../services/settings';
import Sync from '../../services/sync';
import {
  clearAllStores,
  initialize,
  useAttachmentStore,
  useMessageStore,
  useNoteStore,
  useSettingStore,
  useUserStore
} from '../../stores/stores';
import { updateStatusBarColor } from '../color-scheme';
import { db } from '../database';
import { MMKV } from '../database/mmkv';
import { eClearEditor, eCloseProgressDialog, eOpenLoginDialog, refreshNotesPage } from '../events';
import { sleep } from '../time';

const SodiumEventEmitter = new NativeEventEmitter(NativeModules.Sodium);

export const useAppEvents = () => {
  const loading = useNoteStore(state => state.loading);
  const setLastSynced = useUserStore(state => state.setLastSynced);
  const setUser = useUserStore(state => state.setUser);
  const setSyncing = useUserStore(state => state.setSyncing);
  const syncedOnLaunch = useRef(false);
  const refValues = useRef({
    subsriptionSuccessListener: null,
    subsriptionErrorListener: null,
    isUserReady: false,
    prevState: null,
    showingDialog: false,
    removeInternetStateListener: null,
    isReconnecting: false
  });

  const onMediaDownloaded = ({ hash, groupId, src }) => {
    if (groupId?.startsWith('monograph')) return;
    tiny.call(
      EditorWebView,
      `
        (function(){
          let image = ${JSON.stringify({ hash, src })};
          tinymce.activeEditor._replaceImage(image);
        })();
        `
    );
  };

  const onLoadingAttachmentProgress = data => {
    useAttachmentStore.getState().setLoading(data.total === data.current ? null : data);
  };

  const onFileEncryptionProgress = ({ total, progress }) => {
    console.log('encryption progress: ', (progress / total).toFixed(2));
    useAttachmentStore.getState().setEncryptionProgress((progress / total).toFixed(2));
  };

  useEffect(() => {
    let subs = [
      Appearance.addChangeListener(SettingsService.setTheme),
      Linking.addEventListener('url', onUrlRecieved),
      SodiumEventEmitter.addListener('onSodiumProgress', onFileEncryptionProgress)
    ];

    EV.subscribe(EVENTS.appRefreshRequested, onSyncComplete);
    EV.subscribe(EVENTS.databaseSyncRequested, onRequestPartialSync);
    EV.subscribe(EVENTS.userLoggedOut, onLogout);
    EV.subscribe(EVENTS.userEmailConfirmed, onEmailVerified);
    EV.subscribe(EVENTS.userSessionExpired, onSessionExpired);
    EV.subscribe(EVENTS.userCheckStatus, PremiumService.onUserStatusCheck);
    EV.subscribe(EVENTS.userSubscriptionUpdated, onAccountStatusChange);
    EV.subscribe(EVENTS.mediaAttachmentDownloaded, onMediaDownloaded);
    EV.subscribe(EVENTS.attachmentsLoading, onLoadingAttachmentProgress);

    eSubscribeEvent('userLoggedIn', onUserUpdated);

    return () => {
      eUnSubscribeEvent('userLoggedIn', onUserUpdated);
      EV.unsubscribe(EVENTS.userSessionExpired, onSessionExpired);
      EV.unsubscribe(EVENTS.appRefreshRequested, onSyncComplete);
      EV.unsubscribe(EVENTS.databaseSyncRequested, onRequestPartialSync);
      EV.unsubscribe(EVENTS.userLoggedOut, onLogout);
      EV.unsubscribe(EVENTS.userEmailConfirmed, onEmailVerified);
      EV.unsubscribe(EVENTS.mediaAttachmentDownloaded, onMediaDownloaded);
      EV.subscribe(EVENTS.attachmentsLoading, onLoadingAttachmentProgress);
      EV.unsubscribe(EVENTS.userCheckStatus, PremiumService.onUserStatusCheck);
      EV.unsubscribe(EVENTS.userSubscriptionUpdated, onAccountStatusChange);
      EV.unsubscribeAll();

      subs.forEach(sub => sub?.remove());
    };
  }, []);

  const onSessionExpired = async () => {
    await SettingsService.set({
      sessionExpired: true
    });
    eSendEvent('session_expired');
  };

  useEffect(() => {
    let sub;
    if (!loading) {
      sub = AppState.addEventListener('change', onAppStateChanged);
      (async () => {
        try {
          let url = await Linking.getInitialURL();
          if (url?.startsWith('https://app.notesnook.com/account/verified')) {
            await onEmailVerified();
          }
          await onUserUpdated();
        } catch (e) {}
      })();
      refValues.current.removeInternetStateListener =
        NetInfo.addEventListener(onInternetStateChanged);
    }
    return () => {
      refValues.current?.removeInternetStateListener &&
        refValues.current?.removeInternetStateListener();
      sub?.remove();
      unsubIAP();
    };
  }, [loading]);

  const onInternetStateChanged = async state => {
    if (!syncedOnLaunch.current) return;
    reconnectSSE(state);
  };

  const onSyncComplete = async () => {
    console.log('sync complete');
    initialize();
    setLastSynced(await db.lastSynced());
    setSyncing(false);
    if (getNote()) {
      await updateNoteInEditor();
    }
  };

  const onUrlRecieved = async res => {
    let url = res ? res.url : '';
    try {
      if (url.startsWith('https://app.notesnook.com/account/verified')) {
        await onEmailVerified();
      } else {
        return;
      }
    } catch (e) {}
  };

  const onEmailVerified = async () => {
    let user = await db.user.getUser();
    setUser(user);
    if (!user) return;
    SettingsService.set({
      userEmailConfirmed: true
    });
    await PremiumService.setPremiumStatus();
    Walkthrough.present('emailconfirmed', false, true);
    if (user?.isEmailConfirmed) {
      clearMessage();
    }
  };

  const attachIAPListeners = async () => {
    await RNIap.initConnection()
      .catch(e => {
        console.log(e);
      })
      .then(async () => {
        refValues.current.subsriptionSuccessListener =
          RNIap.purchaseUpdatedListener(onSuccessfulSubscription);
        refValues.current.subsriptionErrorListener =
          RNIap.purchaseErrorListener(onSubscriptionError);
      });
  };

  const onAccountStatusChange = async userStatus => {
    if (!PremiumService.get() && userStatus.type === 5) {
      PremiumService.subscriptions.clear();
      Walkthrough.present('prouser', false, true);
    }
    await PremiumService.setPremiumStatus();
  };

  const onRequestPartialSync = async (full, force) => {
    console.log('auto sync request', full, force);
    try {
      if (full || force) {
        Sync.run('global', force, full);
        return;
      }
      setSyncing(true);
      let res = await doInBackground(async () => {
        try {
          await db.sync(false);
          return true;
        } catch (e) {
          return e.message;
        }
      });
      if (res !== true) throw new Error(res);
      setLastSynced(await db.lastSynced());
    } catch (e) {
      setSyncing(false);
      let status = await NetInfo.fetch();
      if (status.isConnected && status.isInternetReachable) {
        ToastEvent.error(e, 'Sync failed', 'global');
      }
    } finally {
      setSyncing(false);
    }
  };

  const onLogout = async reason => {
    setUser(null);
    clearAllStores();

    SettingsService.init();
    setSyncing(false);
    setLoginMessage();
    await PremiumService.setPremiumStatus();
    SettingsService.set({
      introCompleted: true
    });
    presentSheet({
      title: reason ? reason : 'User logged out',
      paragraph: `You have been logged out of your account.`,
      action: async () => {
        eSendEvent(eCloseProgressDialog);
        await sleep(300);
        eSendEvent(eOpenLoginDialog);
      },
      icon: 'logout',
      actionText: 'Login'
    });

    setTimeout(() => {
      initialize();
    }, 1000);
  };

  const unsubIAP = () => {
    if (refValues.current?.subsriptionSuccessListener) {
      refValues.current.subsriptionSuccessListener?.remove();
      refValues.current.subsriptionSuccessListener = null;
    }
    if (refValues.current?.subsriptionErrorListener) {
      refValues.current.subsriptionErrorListener?.remove();
      refValues.current.subsriptionErrorListener = null;
    }
  };

  const onUserUpdated = async login => {
    console.log(`onUserUpdated: ${login}`);
    let user;
    try {
      user = await db.user.getUser();
      await PremiumService.setPremiumStatus();
      if (login) {
        console.log('sync started');
        await Sync.run();
        console.log('hide progress dialog');
        eSendEvent(eCloseProgressDialog);
      }
      setLastSynced(await db.lastSynced());
      if (!user) {
        return setLoginMessage();
      }

      let userEmailConfirmed = SettingsService.get().userEmailConfirmed;
      setUser(user);
      if (SettingsService.get().sessionExpired) {
        syncedOnLaunch.current = true;
        return;
      }

      clearMessage();
      attachIAPListeners();

      if (!login) {
        user = await db.user.fetchUser();
        setUser(user);
      }

      await PremiumService.setPremiumStatus();
      if (user.isEmailConfirmed && !userEmailConfirmed) {
        setTimeout(() => {
          onEmailVerified();
        }, 1000);
        SettingsService.set({
          userEmailConfirmed: true
        });
      }
    } catch (e) {}

    user = await db.user.getUser();
    if (
      user?.isEmailConfirmed &&
      !SettingsService.get().recoveryKeySaved &&
      !useMessageStore.getState().message?.visible
    ) {
      setRecoveryKeyMessage();
    }
    if (!user.isEmailConfirmed) setEmailVerifyMessage();

    if (PremiumService.get() && user) {
      if (SettingsService.get().reminder === 'off') {
        await SettingsService.set({ reminder: 'daily' });
      }
      if (Backup.checkBackupRequired()) {
        sleep(2000).then(() => Backup.checkAndRun());
      }
    }
    refValues.current.isUserReady = true;

    syncedOnLaunch.current = true;
  };

  const onSuccessfulSubscription = async subscription => {
    await PremiumService.subscriptions.set(subscription);
    await PremiumService.subscriptions.verify(subscription);
  };

  const onSubscriptionError = async error => {
    ToastEvent.show({
      heading: 'Failed to subscribe',
      type: 'error',
      message: error.message,
      context: 'local'
    });
  };

  const onAppStateChanged = async state => {
    console.log('onAppStateChanged');
    if (state === 'active') {
      updateStatusBarColor();
      if (
        SettingsService.get().appLockMode !== 'background' &&
        !SettingsService.get().privacyScreen
      ) {
        enabled(false);
      }

      if (SettingsService.get().appLockMode === 'background') {
        if (useSettingStore.getState().requestBiometrics) {
          console.log('requesting biometrics');
          useSettingStore.getState().setRequestBiometrics(false);
          return;
        }
        if (refValues.current?.prevState === 'background' && !refValues.current?.showingDialog) {
          refValues.current.showingDialog = true;
          refValues.current.prevState = 'active';
          useUserStore.getState().setVerifyUser(true);

          let result = await BiometricService.validateUser('Unlock to access your notes');
          if (result) {
            useUserStore.getState().setVerifyUser(false);
            refValues.current.showingDialog = false;
          }
        }
      }
      refValues.current.prevState = 'active';
      console.log('reconnect sse');
      await reconnectSSE();

      await checkIntentState();
      if (getWebviewInit()) {
        await MMKV.removeItem('appState');
      }
      let user = await db.user.getUser();
      if (user && !user.isEmailConfirmed) {
        try {
          let user = await db.user.fetchUser();
          if (user?.isEmailConfirmed) {
            onEmailVerified();
          }
        } catch (e) {}
      }
    } else {
      refValues.current.prevState = 'background';
      if (getNote()?.locked && SettingsService.get().appLockMode === 'background') {
        eSendEvent(eClearEditor);
      }
      await storeAppState();
      if (
        SettingsService.get().privacyScreen ||
        SettingsService.get().appLockMode === 'background'
      ) {
        enabled(true);
      }
    }
  };

  async function reconnectSSE(connection) {
    if (refValues.current?.isReconnecting) return;
    if (!refValues.current?.isUserReady) {
      return;
    }
    if (SettingsService.get().sessionExpired) {
      refValues.current.isReconnecting = false;
      return;
    }
    refValues.current.isReconnecting = true;
    let state = connection;
    console.log('SSE:', 'TRYING TO RECONNECT');
    try {
      if (!state) {
        state = await NetInfo.fetch();
      }

      let user = await db.user.getUser();
      if (user && state.isConnected && state.isInternetReachable) {
        await db.connectSSE();
      }
      refValues.current.isReconnecting = false;
    } catch (e) {
      refValues.current.isReconnecting = false;
    }
  }

  async function storeAppState() {
    if (editing.currentlyEditing) {
      if (getNote()?.locked) return;
      let state = JSON.stringify({
        editing: editing.currentlyEditing,
        note: getNote(),
        movedAway: editing.movedAway,
        timestamp: Date.now()
      });
      await MMKV.setItem('appState', state);
    }
  }

  async function checkIntentState() {
    try {
      let notesAddedFromIntent = await MMKV.getItem('notesAddedFromIntent');
      let shareExtensionOpened = await MMKV.getItem('shareExtensionOpened');
      if (notesAddedFromIntent) {
        if (Platform.OS === 'ios') {
          await db.init();
          await db.notes.init();
        }
        useNoteStore.getState().setNotes();
        eSendEvent(refreshNotesPage);
        MMKV.removeItem('notesAddedFromIntent');
        initialize();
        eSendEvent(refreshNotesPage);
      }
      if (notesAddedFromIntent || shareExtensionOpened) {
        eSendEvent('loadingNote', getNote());
        eSendEvent('webviewreset', true);
        MMKV.removeItem('shareExtensionOpened');
      }
    } catch (e) {
      console.log(e);
    }
  }

  return true;
};
