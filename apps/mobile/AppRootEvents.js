import NetInfo from '@react-native-community/netinfo';
import {EV, EVENTS} from 'notes-core/common';
import React, {useEffect} from 'react';
import {Appearance, AppState, Linking, Platform, StatusBar} from 'react-native';
import * as RNIap from 'react-native-iap';
import {enabled} from 'react-native-privacy-snapshot';
import {updateEvent} from './src/components/DialogManager/recievers';
import {useTracked} from './src/provider';
import {Actions} from './src/provider/Actions';
import Backup from './src/services/Backup';
import {eSendEvent, ToastEvent} from './src/services/EventManager';
import {
  clearMessage,
  setEmailVerifyMessage,
  setLoginMessage,
} from './src/services/Message';
import Navigation from './src/services/Navigation';
import PremiumService from './src/services/PremiumService';
import SettingsService from './src/services/SettingsService';
import Sync from './src/services/Sync';
import {APP_VERSION, editing} from './src/utils';
import {COLOR_SCHEME} from './src/utils/Colors';
import {db} from './src/utils/DB';
import {
  eClearEditor,
  eCloseProgressDialog,
  eOpenLoginDialog,
  eOpenProgressDialog,
  refreshNotesPage,
} from './src/utils/Events';
import {MMKV} from './src/utils/mmkv';
import {sleep} from './src/utils/TimeUtils';
import {getNote, getWebviewInit} from './src/views/Editor/Functions';

let prevTransactionId = null;
let subsriptionSuccessListener;
let subsriptionErrorListener;

function updateStatusBarColor() {
  StatusBar.setBarStyle(
    COLOR_SCHEME.night ? 'light-content' : 'dark-content',
    true,
  );
  if (Platform.OS === 'android') {
    StatusBar.setBackgroundColor('transparent', true);
    StatusBar.setTranslucent(true, true);
  }
}

async function storeAppState() {
  if (editing.currentlyEditing) {
    let state = JSON.stringify({
      editing: editing.currentlyEditing,
      note: getNote(),
      movedAway: editing.movedAway,
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
      updateEvent({type: Actions.NOTES});
      eSendEvent(refreshNotesPage);
      MMKV.removeItem('notesAddedFromIntent');
      updateEvent({type: Actions.ALL});
      eSendEvent(refreshNotesPage);
    }
  } catch (e) {}
}

async function reconnectSSE(connection) {
  let state = connection;
  try {
    if (!state) {
      state = await NetInfo.fetch();
    }
    let user = await db.user.getUser();
    if (user && state.isConnected && state.isInternetReachable) {
      await db.connectSSE();
    }
  } catch (e) {}
}

const onAppStateChanged = async (state) => {
  if (state === 'active') {
    updateStatusBarColor();
    if (SettingsService.get().privacyScreen) {
      enabled(false);
    }
    await reconnectSSE();
    await checkIntentState();
    if (getWebviewInit()) {
      await MMKV.removeItem('appState');
    }
  } else {
    await storeAppState();
    if (SettingsService.get().privacyScreen) {
      enabled(true);
    }
  }
};

export const AppRootEvents = React.memo(
  () => {
    const [state, dispatch] = useTracked();
    const {loading} = state;

    useEffect(() => {
      Appearance.addChangeListener(SettingsService.setTheme);
      Linking.addEventListener('url', onUrlRecieved);
      EV.subscribe(EVENTS.appRefreshRequested, onSyncComplete);
      EV.subscribe(EVENTS.databaseSyncRequested, partialSync);
      EV.subscribe(EVENTS.userLoggedOut, onLogout);
      EV.subscribe(EVENTS.userEmailConfirmed, onEmailVerified);
      EV.subscribe(EVENTS.userCheckStatus, PremiumService.onUserStatusCheck);
      EV.subscribe(EVENTS.userSubscriptionUpdated, onAccountStatusChange);
      EV.subscribe(EVENTS.noteRemoved, onNoteRemoved);

      return () => {
        EV.unsubscribe(EVENTS.appRefreshRequested, onSyncComplete);
        EV.unsubscribe(EVENTS.databaseSyncRequested, partialSync);
        EV.unsubscribe(EVENTS.userLoggedOut, onLogout);
        EV.unsubscribe(EVENTS.userEmailConfirmed, onEmailVerified);
        EV.unsubscribe(EVENTS.noteRemoved, onNoteRemoved);
        EV.unsubscribe(
          EVENTS.userCheckStatus,
          PremiumService.onUserStatusCheck,
        );
        EV.unsubscribe(EVENTS.userSubscriptionUpdated, onAccountStatusChange);

        Appearance.removeChangeListener(SettingsService.setTheme);
        Linking.removeEventListener('url', onUrlRecieved);
      };
    }, []);

    const onNoteRemoved = async (id) => {
      try {
        console.log("removing note");
        await db.notes.remove(id);
        Navigation.setRoutesToUpdate([
          Navigation.routeNames.Favorites,
          Navigation.routeNames.Notes,
          Navigation.routeNames.NotesPage,
          Navigation.routeNames.Trash,
          Navigation.routeNames.Notebook,
        ]);
        eSendEvent(eClearEditor);
      } catch (e) {}
    };

    useEffect(() => {
      let unsubscribe;
      if (!loading) {
        unsubscribe = NetInfo.addEventListener(onInternetStateChanged);
        AppState.addEventListener('change', onAppStateChanged);
        (async () => {
          try {
            let url = await Linking.getInitialURL();
            if (url?.startsWith('https://app.notesnook.com/account/verified')) {
              await onEmailVerified();
            }
            await setCurrentUser();
            await Backup.checkAndRun();
            let version = await db.version();
            if (version.mobile > APP_VERSION) {
              eSendEvent('updateDialog', ver);
            }
          } catch (e) {
            console.log(e);
          }
        })();
        if (!__DEV__) {
          try {
            /*   Sentry.init({
              dsn:
                'https://317a5c31caf64d1e9b27abf15eb1a554@o477952.ingest.sentry.io/5519681',
              release: 'notesnook-mobile@1.1.0',
              
            }); */
          } catch (e) {
            console.log(e);
          }
        }
      }
      return () => {
        unsubscribe && unsubscribe();
        AppState.removeEventListener('change', onAppStateChanged);
        unsubIAP();
      };
    }, [loading]);

    const onInternetStateChanged = async (state) => {
      reconnectSSE(state);
    };

    const onSyncComplete = async () => {
      dispatch({type: Actions.ALL});
      dispatch({type: Actions.LAST_SYNC, lastSync: await db.lastSynced()});
    };

    const onUrlRecieved = async (res) => {
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
      dispatch({type: Actions.USER, user: user});
      if (!user) return;
      await PremiumService.setPremiumStatus();
      let message =
        user?.subscription?.type === 2
          ? 'Thank you for signing up for Notesnook Beta Program. Enjoy all premium features for free for the next 3 months.'
          : 'Your Notesnook Pro Trial has been activated. Enjoy all premium features for free for the next 14 days!';
      eSendEvent(eOpenProgressDialog, {
        title: 'Email confirmed!',
        paragraph: message,
        noProgress: true,
      });

      if (user?.isEmailConfirmed) {
        clearMessage(dispatch);
      }
    };

    const attachIAPListeners = async () => {
      await RNIap.initConnection()
        .catch((e) => {
          console.log(e);
        })
        .then(() => {
          subsriptionSuccessListener = RNIap.purchaseUpdatedListener(
            onSuccessfulSubscription,
          );
          subsriptionErrorListener = RNIap.purchaseErrorListener(
            onSubscriptionError,
          );
        });
    };

    const onAccountStatusChange = async (userStatus) => {
      console.log('STATUS CODE', userStatus);

      if (!PremiumService.get() && userStatus.type === 5) {
        console.log('STATUS CODE IN', userStatus.type);
        eSendEvent(eOpenProgressDialog, {
          title: 'Notesnook Pro',
          paragraph: `Your Notesnook Pro subscription has been successfully activated.`,
          action: async () => {
            eSendEvent(eCloseProgressDialog);
          },
          icon: 'check',
          actionText: 'Continue',
          noProgress: true,
        });
      }
      await PremiumService.setPremiumStatus();
    };

    const partialSync = async () => {
      try {
        dispatch({type: Actions.SYNCING, syncing: true});
        await db.sync(false);
        dispatch({type: Actions.LAST_SYNC, lastSync: await db.lastSynced()});
      } catch (e) {
      } finally {
        dispatch({type: Actions.SYNCING, syncing: false});
      }
    };

    const onLogout = async (reason) => {
      dispatch({type: Actions.USER, user: null});
      dispatch({type: Actions.CLEAR_ALL});
      dispatch({type: Actions.SYNCING, syncing: false});
      setLoginMessage(dispatch);
      await PremiumService.setPremiumStatus();
      eSendEvent(eOpenProgressDialog, {
        title: reason ? reason : 'User logged out',
        paragraph: `You have been logged out of your account.`,
        action: async () => {
          eSendEvent(eCloseProgressDialog);
          await sleep(50);
          eSendEvent(eOpenLoginDialog);
        },
        icon: 'logout',
        actionText: 'Relogin',
        noProgress: true,
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

    const setCurrentUser = async () => {
      try {
        let user = await db.user.fetchUser(true);
        if (user) {
          attachIAPListeners();
          clearMessage(dispatch);
          dispatch({type: Actions.USER, user: user});
          await PremiumService.setPremiumStatus();
          if (!user.isEmailConfirmed) {
            setEmailVerifyMessage(dispatch);
            return;
          }
          await Sync.run();
        } else {
          await PremiumService.setPremiumStatus();
          setLoginMessage(dispatch);
        }
      } catch (e) {
        let user = await db.user.getUser();
        if (user && !user.isEmailConfirmed) {
          setEmailVerifyMessage(dispatch);
        } else if (!user) {
          setLoginMessage(dispatch);
        } else {
          console.log('unknown error', e);
        }
      }
    };

    const onSuccessfulSubscription = async (subscription) => {
      const receipt = subscription.transactionReceipt;

      if (prevTransactionId === subscription.transactionId) {
        console.log('returning same ID');
        return;
      }
      await processReceipt(receipt);
    };

    const onSubscriptionError = async (error) => {
      console.log('IAP ERROR', error);
      ToastEvent.show(error.message, 'error', 'local');
      if (Platform.OS === 'ios') {
        await RNIap.clearTransactionIOS();
      }
    };

    const processReceipt = async (receipt) => {
      if (receipt) {
        if (Platform.OS === 'ios') {
          let user = await db.user.getUser();
          if (!user) return;
          fetch('http://192.168.10.7:6264/apple/verify', {
            method: 'POST',
            body: JSON.stringify({
              receipt_data: receipt,
              user_id: user.id,
            }),
            headers: {
              'Content-Type': 'application/json',
            },
          })
            .then(async (r) => {
              let text = await r.text();
              if (text === 'Receipt already expired.') {
                await RNIap.clearTransactionIOS();
              } else {
                console.log('FINSIHING TRANSACTION');
                await RNIap.finishTransactionIOS(prevTransactionId);
                await RNIap.clearTransactionIOS();
              }
            })
            .catch((e) => {
              console.log(e, 'ERROR');
            });
        }
      }
    };

    return <></>;
  },
  () => true,
);
