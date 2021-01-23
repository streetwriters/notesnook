import Sentry from '@sentry/react-native';
import {EV, EVENTS} from 'notes-core/common';
import React, {useEffect} from 'react';
import {Appearance, AppState, Linking, Platform, StatusBar} from 'react-native';
import * as RNIap from 'react-native-iap';
import {enabled} from 'react-native-privacy-snapshot';
import {updateEvent} from './src/components/DialogManager/recievers';
import {useTracked} from './src/provider';
import {Actions} from './src/provider/Actions';
import Backup from './src/services/Backup';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent,
} from './src/services/EventManager';
import {
  clearMessage,
  setEmailVerifyMessage,
  setLoginMessage,
} from './src/services/Message';
import PremiumService from './src/services/PremiumService';
import SettingsService from './src/services/SettingsService';
import Sync from './src/services/Sync';
import {APP_VERSION, editing} from './src/utils';
import {COLOR_SCHEME} from './src/utils/Colors';
import {db} from './src/utils/DB';
import {
  eCloseProgressDialog,
  eDispatchAction,
  eOpenLoginDialog,
  eOpenProgressDialog,
  refreshNotesPage,
} from './src/utils/Events';
import {MMKV} from './src/utils/mmkv';
import {sleep} from './src/utils/TimeUtils';
import {getNote, getWebviewInit} from './src/views/Editor/Functions';

let prevTransactionId = null;

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

const onAppStateChanged = async (state) => {
  if (state === 'active') {
    updateStatusBarColor();
    if (SettingsService.get().privacyScreen) {
      enabled(false);
    }

    let intent = await MMKV.getItem('notesAddedFromIntent');
    if (intent) {
      try {
        if (Platform.OS === 'ios') {
          await db.init();
          await db.notes.init();
          updateEvent({type: Actions.NOTES});
          eSendEvent(refreshNotesPage);
          console.log('RELOADING APP');
        } else {
          updateEvent({type: Actions.NOTES});
          eSendEvent(refreshNotesPage);
        }
      } catch (e) {
        console.log(e);
      }
      MMKV.removeItem('notesAddedFromIntent');
      updateEvent({type: Actions.ALL});
      eSendEvent(refreshNotesPage);
    }
    if (getWebviewInit()) {
      await MMKV.removeItem('appState');
    }
  } else {
    if (editing.currentlyEditing) {
      let state = JSON.stringify({
        editing: editing.currentlyEditing,
        note: getNote(),
        movedAway: editing.movedAway,
      });
      await MMKV.setItem('appState', state);
    }

    if (SettingsService.get().privacyScreen) {
      enabled(true);
    }
  }
};

let subsriptionSuccessListener;
let subsriptionErrorListener;

export const AppRootEvents = React.memo(
  () => {
    const [state, dispatch] = useTracked();
    const {loading} = state;

    useEffect(() => {
      if (!loading) {
        Linking.getInitialURL().then(async (url) => {
          if (
            url &&
            url.startsWith('https://app.notesnook.com/account/verified')
          ) {
            await onEmailVerified();
          }
        });
        Backup.checkAndRun().then((r) => r);
        setCurrentUser().then(console.log).catch(console.log);
        db.version()
          .then((ver) => {
            if (ver.mobile > APP_VERSION) {
              eSendEvent('updateDialog', ver);
            }
          })
          .catch(console.log);

        eSubscribeEvent(eDispatchAction, (type) => {
          dispatch(type);
        });
        attachIAPListeners();
        AppState.addEventListener('change', onAppStateChanged);
        Appearance.addChangeListener(SettingsService.setTheme);
        Linking.addEventListener('url', onUrlRecieved);
        EV.subscribe(EVENTS.appRefreshRequested, onSyncComplete);
        EV.subscribe(EVENTS.databaseSyncRequested, partialSync);
        EV.subscribe(EVENTS.userLoggedOut, onLogout);
        EV.subscribe(EVENTS.userEmailConfirmed, onEmailVerified);
        EV.subscribe(EVENTS.userCheckStatus, PremiumService.onUserStatusCheck);
        EV.subscribe(EVENTS.userSubscriptionUpdated, onAccountStatusChange);

        if (!__DEV__) {
          try {
            Sentry.init({
              dsn:
                'https://317a5c31caf64d1e9b27abf15eb1a554@o477952.ingest.sentry.io/5519681',
              release: 'notesnook-mobile@1.1.0',
            });
          } catch (e) {}
        }
      }
      return () => {
        EV.unsubscribe(EVENTS.appRefreshRequested, onSyncComplete);
        EV.unsubscribe(EVENTS.databaseSyncRequested, partialSync);
        EV.unsubscribe(EVENTS.userLoggedOut, onLogout);
        EV.unsubscribe(EVENTS.userEmailConfirmed, onEmailVerified);
        EV.unsubscribe(EVENTS.userCheckStatus, PremiumService.onUserStatusCheck);
        EV.unsubscribe(EVENTS.userSubscriptionUpdated, onAccountStatusChange);

        eUnSubscribeEvent(eDispatchAction, (type) => {
          dispatch(type);
        });
        AppState.removeEventListener('change', onAppStateChanged);
        Appearance.removeChangeListener(SettingsService.setTheme);
        Linking.removeEventListener('url', onUrlRecieved);
        unsubIAP();
      };
    }, [loading]);

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
        title: 'Email Confirmed!',
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

    const onAccountStatusChange = async () => {
     
      await PremiumService.setPremiumStatus();
      let user = await db.user.getUser();
      if (user.subscription.type === 5) {
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
        title: reason ? reason : 'User Logged Out',
        paragraph: `You have been logged out of your account.`,
        action: async () => {
          eSendEvent(eCloseProgressDialog);
          await sleep(50);
          eSendEvent(eOpenLoginDialog);
        },
        icon: 'logout',
        actionText: 'Login Again',
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
