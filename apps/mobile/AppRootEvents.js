import NetInfo from '@react-native-community/netinfo';
import {EV, EVENTS} from 'notes-core/common';
import React, {useEffect} from 'react';
import {Appearance, AppState, Linking, Platform} from 'react-native';
import RNExitApp from 'react-native-exit-app';
import * as RNIap from 'react-native-iap';
import {enabled} from 'react-native-privacy-snapshot';
import SplashScreen from 'react-native-splash-screen';
import {
  clearAllStores,
  initialize,
  useNoteStore,
  useUserStore
} from './src/provider/stores';
import BiometricService from './src/services/BiometricService';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent
} from './src/services/EventManager';
import {
  clearMessage,
  setEmailVerifyMessage,
  setLoginMessage
} from './src/services/Message';
import Navigation from './src/services/Navigation';
import PremiumService from './src/services/PremiumService';
import SettingsService from './src/services/SettingsService';
import Sync from './src/services/Sync';
import {APP_VERSION, doInBackground, editing} from './src/utils';
import {updateStatusBarColor} from './src/utils/Colors';
import {db} from './src/utils/DB';
import {
  eClearEditor,
  eCloseProgressDialog,
  eOpenLoginDialog,
  eOpenProgressDialog,
  refreshNotesPage
} from './src/utils/Events';
import {MMKV} from './src/utils/mmkv';
import Storage from './src/utils/storage';
import {sleep} from './src/utils/TimeUtils';
import {
  getNote,
  getWebviewInit,
  updateNoteInEditor
} from './src/views/Editor/Functions';

let prevTransactionId = null;
let subsriptionSuccessListener;
let subsriptionErrorListener;
let isUserReady = false;
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

async function reconnectSSE(connection) {
  if (!isUserReady) {
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

let prevState = null;
let showingDialog = false;
let removeInternetStateListener;

export const AppRootEvents = React.memo(
  () => {
    const loading = useNoteStore(state => state.loading);
    const setLastSynced = useUserStore(state => state.setLastSynced);
    const setUser = useUserStore(state => state.setUser);
    const setSyncing = useUserStore(state => state.setSyncing);

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
      eSubscribeEvent('userLoggedIn', setCurrentUser);
      removeInternetStateListener = NetInfo.addEventListener(
        onInternetStateChanged
      );
      return () => {
        eUnSubscribeEvent('userLoggedIn', setCurrentUser);
        EV.unsubscribe(EVENTS.userSessionExpired, onSessionExpired);
        EV.unsubscribe(EVENTS.appRefreshRequested, onSyncComplete);
        EV.unsubscribe(EVENTS.databaseSyncRequested, partialSync);
        EV.unsubscribe(EVENTS.userLoggedOut, onLogout);
        EV.unsubscribe(EVENTS.userEmailConfirmed, onEmailVerified);
        EV.unsubscribe(EVENTS.noteRemoved, onNoteRemoved);
        EV.unsubscribe(
          EVENTS.userCheckStatus,
          PremiumService.onUserStatusCheck
        );
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
          } catch (e) {
            console.log(e);
          }
        })();
      }
      return () => {
        removeInternetStateListener && removeInternetStateListener();
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
      console.log('sync complete')
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
      await PremiumService.setPremiumStatus();
      let message =
        user?.subscription?.type === 2
          ? 'Thank you for signing up for Notesnook Beta Program. Enjoy all premium features for free for the next 3 months.'
          : 'Your Notesnook Pro Trial has been activated. Enjoy all premium features for the next 14 days for free!';
      eSendEvent(eOpenProgressDialog, {
        title: 'Email confirmed!',
        paragraph: message,
        noProgress: true
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
          subsriptionSuccessListener = RNIap.purchaseUpdatedListener(
            onSuccessfulSubscription
          );
          subsriptionErrorListener = RNIap.purchaseErrorListener(
            onSubscriptionError
          );
        });
    };

    const onAccountStatusChange = async userStatus => {
      if (!PremiumService.get() && userStatus.type === 5) {
        PremiumService.subscriptions.clear();
        eSendEvent(eOpenProgressDialog, {
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
      eSendEvent(eOpenProgressDialog, {
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
    };

    unsubIAP = () => {
      if (subsriptionSuccessListener) {
        subsriptionSuccessListener?.remove();
        subsriptionSuccessListener = null;
      }
      if (subsriptionErrorListener) {
        subsriptionErrorListener?.remove();
        subsriptionErrorListener = null;
      }
    };

    const setCurrentUser = async login => {
      try {
        let user = await db.user.getUser();
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
            return;
          }
         
          let res = await doInBackground(async () => {
            try {
              user = await db.user.fetchUser();
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
        isUserReady = true;
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
          if (prevState === 'background' && !showingDialog) {
            showingDialog = true;
            prevState = 'active';
            if (Platform.OS === 'android') {
              SplashScreen.show();
            } else {
              eSendEvent('load_overlay', 'hide');
            }

            let result = await BiometricService.validateUser(
              'Unlock to access your notes'
            );
            if (result) {
              showingDialog = false;
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
        prevState = 'active';
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
        prevState = 'background';
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

    return <></>;
  },
  () => true
);
