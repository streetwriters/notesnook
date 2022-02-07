import NetInfo from '@react-native-community/netinfo';
import { EV, EVENTS } from 'notes-core/common';
import React, { useEffect, useRef } from 'react';
import {
  Appearance,
  AppState,
  Linking,
  NativeEventEmitter,
  NativeModules,
  Platform,
  View
} from 'react-native';
import RNExitApp from 'react-native-exit-app';
import * as RNIap from 'react-native-iap';
import { enabled } from 'react-native-privacy-snapshot';
import { doInBackground, editing } from '.';
import { ProFeatures } from '../components/ResultDialog/pro-features';
import {
  clearAllStores,
  initialize,
  useAttachmentStore,
  useNoteStore,
  useUserStore
} from '../provider/stores';
import Backup from '../services/Backup';
import BiometricService from '../services/BiometricService';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  presentSheet,
  ToastEvent
} from '../services/EventManager';
import {
  clearMessage,
  setEmailVerifyMessage,
  setLoginMessage,
  setRecoveryKeyMessage
} from '../services/Message';
import Navigation from '../services/Navigation';
import PremiumService from '../services/PremiumService';
import SettingsService from '../services/SettingsService';
import Sync from '../services/Sync';
import {
  EditorWebView,
  getNote,
  getWebviewInit,
  updateNoteInEditor
} from '../views/Editor/Functions';
import tiny from '../views/Editor/tiny/tiny';
import { updateStatusBarColor } from './Colors';
import { db } from './database';
import { eClearEditor, eCloseProgressDialog, eOpenLoginDialog, refreshNotesPage } from './Events';
import { MMKV } from './mmkv';
import Storage from './storage';
import { sleep } from './TimeUtils';

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
    MMKV.setItem('isUserEmailConfirmed', 'yes');
    await PremiumService.setPremiumStatus();
    let message = 'You have been rewarded 7 more days of free trial. Enjoy using Notesnook!';
    presentSheet({
      title: 'Email confirmed!',
      paragraph: message,
      component: (
        <View
          style={{
            paddingHorizontal: 12,
            paddingBottom: 15,
            alignItems: 'center'
          }}
        >
          <ProFeatures />
        </View>
      )
    });

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
      presentSheet({
        title: 'Notesnook Pro',
        paragraph: `Your Notesnook Pro subscription has been successfully activated.`,
        action: async () => {
          eSendEvent(eCloseProgressDialog);
        },
        icon: 'check',
        actionText: 'Continue'
      });
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
    await MMKV.setItem('introCompleted', 'true');
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

        if (user.isEmailConfirmed) {
          let hasSavedRecoveryKey = await MMKV.getItem('userHasSavedRecoveryKey');
          if (!hasSavedRecoveryKey) {
            setRecoveryKeyMessage();
          }
        }

        await Sync.run();
        if (!user.isEmailConfirmed) {
          setEmailVerifyMessage();
          MMKV.setItem('isUserEmailConfirmed', 'no');
          return;
        } else {
          MMKV.setItem('isUserEmailConfirmed', 'yes');
        }

        setUser(user);
      } else {
        setLoginMessage();
      }
    } catch (e) {
      user = await db.user.getUser();
      if (user?.isEmailConfirmed) {
        let hasSavedRecoveryKey = await MMKV.getItem('userHasSavedRecoveryKey');
        if (!hasSavedRecoveryKey) {
          setRecoveryKeyMessage();
        }
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
          await SettingsService.set('reminder', 'daily');
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
