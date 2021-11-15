import NetInfo from '@react-native-community/netinfo';
import {EV, EVENTS} from 'notes-core/common';
import React, {useEffect, useRef} from 'react';
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
import {enabled} from 'react-native-privacy-snapshot';
import SplashScreen from 'react-native-splash-screen';
import {
  clearAllStores,
  initialize,
  useAttachmentStore,
  useNoteStore,
  useUserStore
} from '../provider/stores';
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
  setLoginMessage
} from '../services/Message';
import Navigation from '../services/Navigation';
import PremiumService from '../services/PremiumService';
import SettingsService from '../services/SettingsService';
import Sync from '../services/Sync';
import {APP_VERSION, doInBackground, editing} from '.';
import {updateStatusBarColor} from './Colors';
import {db} from './database';
import {
  eClearEditor,
  eCloseProgressDialog,
  eOpenLoginDialog,
  eOpenProgressDialog,
  refreshNotesPage
} from './Events';
import {MMKV} from './mmkv';
import Storage from './storage';
import {sleep} from './TimeUtils';
import {
  EditorWebView,
  getNote,
  getWebviewInit,
  updateNoteInEditor
} from '../views/Editor/Functions';
import tiny from '../views/Editor/tiny/tiny';
import {ProFeatures} from '../components/ResultDialog/pro-features';

const SodiumEventEmitter = new NativeEventEmitter(NativeModules.Sodium);

export const useAppEvents = () => {
  const loading = useNoteStore(state => state.loading);
  const setLastSynced = useUserStore(state => state.setLastSynced);
  const setUser = useUserStore(state => state.setUser);
  const setSyncing = useUserStore(state => state.setSyncing);
  const refValues = useRef({
    subsriptionSuccessListener: null,
    subsriptionErrorListener: null,
    isUserReady: false,
    prevState: null,
    showingDialog: false,
    removeInternetStateListener: null
  });

  const onMediaDownloaded = ({hash, groupId, src}) => {
    if (groupId?.startsWith('monograph')) return;
    tiny.call(
      EditorWebView,
      `
        (function(){
          let image = ${JSON.stringify({hash, src})};
          tinymce.activeEditor._replaceImage(image);
        })();
        `
    );
  };

  const onLoadingAttachment = data => {
    useAttachmentStore
      .getState()
      .setLoading(data.total === data.current ? null : data);
  };

  const onSodiumProgress = ({total, progress}) => {
    console.log('encryption progress: ', (progress / total).toFixed(2));
    useAttachmentStore
      .getState()
      .setEncryptionProgress((progress / total).toFixed(2));
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
    EV.subscribe(EVENTS.noteRemoved, onNoteRemoved);
    EV.subscribe(EVENTS.mediaAttachmentDownloaded, onMediaDownloaded);
    EV.subscribe(EVENTS.attachmentsLoading, onLoadingAttachment);

    let ubsubsodium = SodiumEventEmitter.addListener(
      'onSodiumProgress',
      onSodiumProgress
    );

    eSubscribeEvent('userLoggedIn', setCurrentUser);
    refValues.current.removeInternetStateListener = NetInfo.addEventListener(
      onInternetStateChanged
    );
    return () => {
      ubsubsodium?.remove();
      eUnSubscribeEvent('userLoggedIn', setCurrentUser);
      EV.unsubscribe(EVENTS.userSessionExpired, onSessionExpired);
      EV.unsubscribe(EVENTS.appRefreshRequested, onSyncComplete);
      EV.unsubscribe(EVENTS.databaseSyncRequested, partialSync);
      EV.unsubscribe(EVENTS.userLoggedOut, onLogout);
      EV.unsubscribe(EVENTS.userEmailConfirmed, onEmailVerified);
      EV.unsubscribe(EVENTS.noteRemoved, onNoteRemoved);
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
    eSendEvent(eOpenLoginDialog, 4);
  };

  const onNoteRemoved = async id => {
    try {
      await db.notes.remove(id);
      Navigation.setRoutesToUpdate([
        Navigation.routeNames.Favorites,
        Navigation.routeNames.Notes,
        Navigation.routeNames.NotesPage,
        Navigation.routeNames.Trash,
        Navigation.routeNames.Notebook
      ]);
      eSendEvent(eClearEditor);
    } catch (e) {}
  };

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
          let version = await db.version();
          if (version.mobile > APP_VERSION) {
            eSendEvent('updateDialog', ver);
          }
        } catch (e) {}
      })();
    }
    return () => {
      refValues.current?.removeInternetStateListener &&
        refValues.current?.removeInternetStateListener();
      AppState.removeEventListener('change', onAppStateChanged);
      unsubIAP();
    };
  }, [loading]);

  const onInternetStateChanged = async state => {
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
    let message =
      'You have been rewarded 7 more days of free trial. Enjoy using Notesnook!';
    presentSheet({
      title: 'Email confirmed!',
      paragraph: message,
      noProgress: true,
      component: (
        <View
          style={{
            paddingHorizontal: 12,
            paddingBottom: 15,
            alignItems: 'center'
          }}>
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
        actionText: 'Continue',
        noProgress: true
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
      actionText: 'Login',
      noProgress: true
    });

    setTimeout(() => {
      initialize();
    }, 1000);
  };

  unsubIAP = () => {
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
    try {
      let user = await db.user.getUser();

      let isUserEmailConfirmed = await MMKV.getStringAsync(
        'isUserEmailConfirmed'
      );

      if ((await MMKV.getItem('loginSessionHasExpired')) === 'expired') {
        setUser(user);
        return;
      }
      if (user) {
        setUser(user);
        clearMessage();
        attachIAPListeners();
        await Sync.run();
        if (!user.isEmailConfirmed) {
          setEmailVerifyMessage();
          MMKV.setItem('isUserEmailConfirmed', 'no');
          return;
        } else {
          MMKV.setItem('isUserEmailConfirmed', 'yes');
        }

        let res = await doInBackground(async () => {
          try {
            user = await db.user.fetchUser();
            if (user.isEmailConfirmed && isUserEmailConfirmed === 'no') {
              setTimeout(() => {
                onEmailVerified();
              }, 1000);
            }
            return true;
          } catch (e) {
            return e.message;
          }
        });
        if (res !== true) throw new Error(res);
        setUser(user);
      } else {
        setLoginMessage();
      }
    } catch (e) {
      let user = await db.user.getUser();
      if (user && !user.isEmailConfirmed) {
        setEmailVerifyMessage();
      } else if (!user) {
        setLoginMessage();
      } else {
        console.log('unknown error', e);
      }
    } finally {
      await PremiumService.setPremiumStatus();
      refValues.current.isUserReady = true;
      if (login) {
        eSendEvent(eCloseProgressDialog);
      }
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
    if (state === 'active') {
      updateStatusBarColor();
      if (
        SettingsService.get().appLockMode !== 'background' &&
        !SettingsService.get().privacyScreen
      ) {
        enabled(false);
      }

      if (SettingsService.get().appLockMode === 'background') {
        if (
          refValues.current?.prevState === 'background' &&
          !refValues.current?.showingDialog
        ) {
          refValues.current.showingDialog = true;
          refValues.current.prevState = 'active';
          if (Platform.OS === 'android') {
            SplashScreen.show();
          } else {
            eSendEvent('load_overlay', 'hide');
          }

          let result = await BiometricService.validateUser(
            'Unlock to access your notes'
          );
          if (result) {
            refValues.current.showingDialog = false;
            if (Platform.OS === 'android') {
              SplashScreen.hide();
            } else {
              eSendEvent('load_overlay', 'show');
            }
          } else {
            RNExitApp.exitApp();
            return;
          }
        }
      }
      refValues.current.prevState = 'active';
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
      if (
        getNote()?.locked &&
        SettingsService.get().appLockMode === 'background'
      ) {
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
    if (!refValues.current?.isUserReady) {
      return;
    }
    let state = connection;
    try {
      if (!state) {
        state = await NetInfo.fetch();
      }

      let user = await db.user.getUser();
      if (user && state.isConnected && state.isInternetReachable) {
        let res = await doInBackground(async () => {
          try {
            await db.connectSSE();
            return true;
          } catch (e) {
            return e.message;
          }
        });
        if (res !== true) throw new Error(res);
      }
    } catch (e) {}
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
      let intent = await MMKV.getItem('notesAddedFromIntent');
      if (intent) {
        if (Platform.OS === 'ios') {
          await db.init();
          await db.notes.init();
        }
        eSendEvent('webviewreset');
        useNoteStore.getState().setNotes();
        eSendEvent(refreshNotesPage);
        MMKV.removeItem('notesAddedFromIntent');
        initialize();
        eSendEvent(refreshNotesPage);
      }
    } catch (e) {}
  }

  return true;
};
