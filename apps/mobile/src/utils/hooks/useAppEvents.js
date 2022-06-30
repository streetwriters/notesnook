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
import { Walkthrough } from '../../components/walkthroughs';
import { editorController, editorState } from '../../screens/editor/tiptap/utils';
import BiometricService from '../../services/biometrics';
import {
  clearMessage,
  setEmailVerifyMessage,
  setLoginMessage,
  setRecoveryKeyMessage
} from '../../services/message';
import PremiumService from '../../services/premium';
import SettingsService from '../../services/settings';
import { updateStatusBarColor } from '../color-scheme';
import { db } from '../database';
import { MMKV } from '../database/mmkv';
import { eClearEditor, eCloseProgressDialog, refreshNotesPage } from '../events';
import Sync from '../../services/sync';
import { clearAllStores, initialize } from '../../stores';
import { useUserStore } from '../../stores/use-user-store';
import { useMessageStore } from '../../stores/use-message-store';
import { useSettingStore } from '../../stores/use-setting-store';
import { useAttachmentStore } from '../../stores/use-attachment-store';
import { useNoteStore } from '../../stores/use-notes-store';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent
} from '../../services/event-manager';
import { useEditorStore } from '../../stores/use-editor-store';

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

  const onLoadingAttachmentProgress = data => {
    useAttachmentStore.getState().setLoading(data.total === data.current ? null : data);
  };

  const onFileEncryptionProgress = ({ total, progress }) => {
    console.log('encryption progress: ', (progress / total).toFixed(2));
    useAttachmentStore.getState().setEncryptionProgress((progress / total).toFixed(2));
  };
  const onSyncProgress = ({ type, total, current }) => {
    console.log(type, total, current);
    if (type !== 'download') return;
    if (total < 10 || current % 10 === 0) {
      initialize();
    }
  };

  useEffect(() => {
    if (!loading) {
      const eventManager = db?.eventManager;
      eventManager?.subscribe(EVENTS.syncProgress, onSyncProgress);
      let sub = eventManager?.subscribe(EVENTS.databaseSyncRequested, onRequestPartialSync);
      eventManager?.subscribe(EVENTS.syncCompleted, onSyncComplete);
      console.log('SUBSCRIBED', sub);
    }

    return () => {
      const eventManager = db?.eventManager;
      console.log('UNSUBSCRIBED');
      eventManager?.unsubscribe(EVENTS.syncCompleted, onSyncComplete);
      eventManager?.unsubscribe(EVENTS.syncProgress, onSyncProgress);
      eventManager?.unsubscribe(EVENTS.databaseSyncRequested, onRequestPartialSync);
    };
  }, [loading]);

  useEffect(() => {
    let subs = [
      Appearance.addChangeListener(SettingsService.setTheme),
      Linking.addEventListener('url', onUrlRecieved),
      SodiumEventEmitter.addListener('onSodiumProgress', onFileEncryptionProgress)
    ];
    EV.subscribe(EVENTS.appRefreshRequested, onSyncComplete);
    EV.subscribe(EVENTS.userLoggedOut, onLogout);
    EV.subscribe(EVENTS.userEmailConfirmed, onEmailVerified);
    EV.subscribe(EVENTS.userSessionExpired, onSessionExpired);
    EV.subscribe(EVENTS.userCheckStatus, PremiumService.onUserStatusCheck);
    EV.subscribe(EVENTS.userSubscriptionUpdated, onAccountStatusChange);
    EV.subscribe(EVENTS.attachmentsLoading, onLoadingAttachmentProgress);
    eSubscribeEvent('userLoggedIn', onUserUpdated);

    return () => {
      eUnSubscribeEvent('userLoggedIn', onUserUpdated);

      EV.unsubscribe(EVENTS.appRefreshRequested, onSyncComplete);
      EV.unsubscribe(EVENTS.userSessionExpired, onSessionExpired);
      EV.unsubscribe(EVENTS.userLoggedOut, onLogout);
      EV.unsubscribe(EVENTS.userEmailConfirmed, onEmailVerified);
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
    eSendEvent(eCloseProgressDialog, 'sync_progress');
    let id = useEditorStore.getState().currentEditingNote;
    let note = id && db.notes.note(id).data;
    if (note) {
      //await updateNoteInEditor();
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
    if (full || force) {
      await Sync.run('global', force, full);
      setSyncing(false);
    } else {
      await Sync.run('global', false, false);
      setSyncing(false);
    }
  };

  const onLogout = async reason => {
    console.log('LOGOUT', reason);
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
    } catch (e) {
      ToastEvent.error(e, 'An error occured', 'global');
    }

    user = await db.user.getUser();
    if (
      user?.isEmailConfirmed &&
      !SettingsService.get().recoveryKeySaved &&
      !useMessageStore.getState().message?.visible
    ) {
      setRecoveryKeyMessage();
    }
    if (!user.isEmailConfirmed) setEmailVerifyMessage();
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
      await MMKV.removeItem('appState');
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
      let id = useEditorStore.getState().currentEditingNote;
      let note = id && db.notes.note(id).data;
      if (note?.locked && SettingsService.get().appLockMode === 'background') {
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
    if (editorState().currentlyEditing) {
      let id = useEditorStore.getState().currentEditingNote;
      let note = id && db.notes.note(id).data;
      if (note?.locked) return;
      let state = JSON.stringify({
        editing: editorState().currentlyEditing,
        note: note,
        movedAway: editorState().movedAway,
        timestamp: Date.now()
      });
      MMKV.setString('appState', state);
    }
  }

  async function checkIntentState() {
    try {
      let notesAddedFromIntent = MMKV.getString('notesAddedFromIntent');
      let shareExtensionOpened = MMKV.getString('shareExtensionOpened');
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
        let id = useEditorStore.getState().currentEditingNote;
        let note = id && db.notes.note(id).data;
        eSendEvent('loadingNote', note);
        eSendEvent('webviewreset', true);
        MMKV.removeItem('shareExtensionOpened');
      }
    } catch (e) {
      console.log(e);
    }
  }

  return true;
};
