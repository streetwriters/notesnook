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
  clearAllStores,
  initialize,
  useAttachmentStore,
  useNoteStore,
  useSettingStore,
  useUserStore
} from '../../stores/stores';
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
  EditorWebView,
  getNote,
  getWebviewInit,
  updateNoteInEditor
} from '../../screens/editor/Functions';
import tiny from '../../screens/editor/tiny/tiny';
import { updateStatusBarColor } from '../color-scheme';
import { db } from '../database';
import { eClearEditor, eCloseProgressDialog, eOpenLoginDialog, refreshNotesPage } from '../events';
import { MMKV } from '../database/mmkv';
import Storage from '../database/storage';
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

  const onLoadingAttachment = data => {
    useAttachmentStore.getState().setLoading(data.total === data.current ? null : data);
  };

  const onSodiumProgress = ({ total, progress }) => {
    console.log('encryption progress: ', (progress / total).toFixed(2));
    useAttachmentStore.getState().setEncryptionProgress((progress / total).toFixed(2));
  };

  useEffect(() => {
    Appearance.addChangeListener(SettingsService.setTheme);
    Linking.addEventListener('url', onUrlRecieved);
    EV.subscribe(EVENTS.appRefreshRequested, onSyncComplete);
    EV.subscribe(EVENTS.databaseSyncRequested, partialSync);
    EV.subscribe(EVENTS.userLoggedOut, onLogout);
    EV.subscribe(EVENTS.userEmailConfirmed, onEmailVerified);
    EV.subscribe(EVENTS.userSessionExpired, onSessionExpired);
    EV.subscribe(EVENTS.userCheckStatus, PremiumService.onUserStatusCheck);
    EV.subscribe(EVENTS.userSubscriptionUpdated, onAccountStatusChange);
    EV.subscribe(EVENTS.mediaAttachmentDownloaded, onMediaDownloaded);
    EV.subscribe(EVENTS.attachmentsLoading, onLoadingAttachment);

    let ubsubsodium = SodiumEventEmitter.addListener('onSodiumProgress', onSodiumProgress);

    eSubscribeEvent('userLoggedIn', setCurrentUser);

    return () => {
      ubsubsodium?.remove();
      eUnSubscribeEvent('userLoggedIn', setCurrentUser);
      EV.unsubscribe(EVENTS.userSessionExpired, onSessionExpired);
      EV.unsubscribe(EVENTS.appRefreshRequested, onSyncComplete);
      EV.unsubscribe(EVENTS.databaseSyncRequested, partialSync);
      EV.unsubscribe(EVENTS.userLoggedOut, onLogout);
      EV.unsubscribe(EVENTS.userEmailConfirmed, onEmailVerified);
      EV.unsubscribe(EVENTS.mediaAttachmentDownloaded, onMediaDownloaded);
      EV.subscribe(EVENTS.attachmentsLoading, onLoadingAttachment);
      EV.unsubscribe(EVENTS.userCheckStatus, PremiumService.onUserStatusCheck);
      EV.unsubscribe(EVENTS.userSubscriptionUpdated, onAccountStatusChange);

      Appearance.removeChangeListener(SettingsService.setTheme);
      Linking.removeEventListener('url', onUrlRecieved);
    };
  }, []);

  const onSessionExpired = async () => {
    await Storage.write('loginSessionHasExpired', 'expired');
    eSendEvent('session_expired');
  };

  // const onNoteRemoved = async id => {
  //   try {
  //     await db.notes.remove(id);
  //     Navigation.setRoutesToUpdate([
  //       Navigation.routeNames.Favorites,
  //       Navigation.routeNames.Notes,
  //       Navigation.routeNames.NotesPage,
  //       Navigation.routeNames.Trash,
  //       Navigation.routeNames.Notebook
  //     ]);
  //     eSendEvent(eClearEditor, id);
  //   } catch (e) {}
  // };

  useEffect(() => {
    if (!loading) {
      AppState.addEventListener('change', onAppStateChanged);
      (async () => {
        try {
          let url = await Linking.getInitialURL();
          if (url?.startsWith('https://app.notesnook.com/account/verified')) {
            await onEmailVerified();
          }
          await setCurrentUser();
        } catch (e) {}
      })();
      refValues.current.removeInternetStateListener =
        NetInfo.addEventListener(onInternetStateChanged);
    }
    return () => {
      refValues.current?.removeInternetStateListener &&
        refValues.current?.removeInternetStateListener();
      AppState.removeEventListener('change', onAppStateChanged);
      unsubIAP();
    };
  }, [loading]);

  const onInternetStateChanged = async state => {
    if (!syncedOnLaunch.current) return;
    reconnectSSE(state);
  };

  const onSyncComplete = async () => {
    initialize();
    setLastSynced(await db.lastSynced());
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

  const partialSync = async () => {
    try {
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
        ToastEvent.show({
          heading: 'Sync failed',
          message: e.message,
          context: 'global'
        });
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

  const setCurrentUser = async login => {
    let user;
    try {
      user = await db.user.getUser();
      let isUserEmailConfirmed = await MMKV.getStringAsync('isUserEmailConfirmed');

      if ((await MMKV.getItem('loginSessionHasExpired')) === 'expired') {
        setUser(user);
        syncedOnLaunch.current = true;
        return;
      }
      if (user) {
        setUser(user);
        clearMessage();
        attachIAPListeners();

        user = await db.user.fetchUser();
        if (user.isEmailConfirmed && isUserEmailConfirmed === 'no') {
          setTimeout(() => {
            onEmailVerified();
          }, 1000);
        }

        if (user.isEmailConfirmed && !SettingsService.get().recoveryKeySaved) {
          setRecoveryKeyMessage();
        }

        await Sync.run();
        setUser(user);
        SettingsService.set({
          userEmailConfirmed: user.isEmailConfirmed
        });

        if (!user.isEmailConfirmed) {
          setEmailVerifyMessage();
        }
      } else {
        setLoginMessage();
      }
    } catch (e) {
      user = await db.user.getUser();
      if (user?.isEmailConfirmed && !SettingsService.get().recoveryKeySaved) {
        setRecoveryKeyMessage();
      }

      if (user && !user.isEmailConfirmed) {
        setEmailVerifyMessage();
      } else if (!user) {
        setLoginMessage();
      } else {
        console.log('unknown error', e);
      }
    } finally {
      await PremiumService.setPremiumStatus();
      user = await db.user.getUser();
      if (PremiumService.get() && user) {
        if (SettingsService.get().reminder === 'off') {
          await SettingsService.set({ reminder: 'daily' });
        }
        if (Backup.checkBackupRequired()) {
          sleep(2000).then(() => Backup.checkAndRun());
        }
      }
      refValues.current.isUserReady = true;
      if (login) {
        eSendEvent(eCloseProgressDialog);
      }
      syncedOnLaunch.current = true;
    }
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
    if ((await MMKV.getItem('loginSessionHasExpired')) === 'expired') {
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
