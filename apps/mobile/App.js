import * as NetInfo from '@react-native-community/netinfo';
import {EV} from 'notes-core/common';
import React, {useEffect} from 'react';
import {
  Appearance,
  AppState,
  Linking,
  NativeModules,
  Platform,
  StatusBar,
} from 'react-native';
import * as RNIap from 'react-native-iap';
import {enabled} from 'react-native-privacy-snapshot';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import SplashScreen from 'react-native-splash-screen';
import {RootView} from './initializer.root';
import {updateEvent} from './src/components/DialogManager/recievers';
import {useTracked} from './src/provider';
import {Actions} from './src/provider/Actions';
import Backup from './src/services/Backup';
import {DDS} from './src/services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from './src/services/EventManager';
import {
  clearMessage,
  setEmailVerifyMessage,
  setLoginMessage,
} from './src/services/Message';
import PremiumService from './src/services/PremiumService';
import SettingsService from './src/services/SettingsService';
import Sync from './src/services/Sync';
import {
  APP_VERSION,
  editing,
  getAppIsIntialized,
  setAppIsInitialized,
  setIntentOnAppLoadProcessed,
} from './src/utils';
import {COLOR_SCHEME} from './src/utils/Colors';
import {db} from './src/utils/DB';
import {
  eClosePremiumDialog,
  eCloseProgressDialog,
  eDispatchAction,
  eOpenLoginDialog,
  eOpenPendingDialog,
  eOpenProgressDialog,
  eOpenSideMenu,
  refreshNotesPage,
} from './src/utils/Events';
import {MMKV} from './src/utils/mmkv';
import {sleep} from './src/utils/TimeUtils';
import EditorRoot from './src/views/Editor/EditorRoot';
import {getNote} from './src/views/Editor/Functions';

let Sentry = null;
let hasPurchased = false;

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
    if (getAppIsIntialized()) {
      await MMKV.removeItem('appState');
      let intent = await MMKV.getItem('notesAddedFromIntent');
      if (intent) {
        try {
          if (Platform.OS === 'ios') {
            await db.init();
            await db.notes.init();
            updateEvent({type: Actions.NOTES});
            eSendEvent(refreshNotesPage);
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
    }
  } else {
    if (editing.currentlyEditing && getAppIsIntialized()) {
      let state = JSON.stringify({
        editing: editing.currentlyEditing,
        note: getNote(),
      });
      await MMKV.setItem('appState', state);
    }

    if (SettingsService.get().privacyScreen) {
      enabled(true);
    }
  }
};

//const onNetworkStateChanged = (netInfo) => {};

const App = () => {
  const [, dispatch] = useTracked();

  let subsriptionSuccessListerner;
  let subsriptionErrorListener;

  useEffect(() => {
    eSubscribeEvent(eDispatchAction, (type) => {
      dispatch(type);
    });
    attachIAPListeners();
    AppState.addEventListener('change', onAppStateChanged);
    Appearance.addChangeListener(SettingsService.setTheme);
    // let unsub = NetInfo.addEventListener(onNetworkStateChanged);
    Linking.addEventListener('url', onUrlRecieved);
    EV.subscribe('db:refresh', onSyncComplete);
    EV.subscribe('db:sync', partialSync);
    EV.subscribe('user:loggedOut', onLogout);
    EV.subscribe('user:checkStatus', PremiumService.onUserStatusCheck);
    return () => {
      setIntentOnAppLoadProcessed(false);
      setAppIsInitialized(false);
      EV.subscribe('db:refresh', onSyncComplete);
      EV.unsubscribe('user:loggedOut', onLogout);
      EV.unsubscribe('db:sync', partialSync);
      EV.unsubscribe('user:checkStatus', PremiumService.onUserStatusCheck);
      eUnSubscribeEvent(eDispatchAction, (type) => {
        dispatch(type);
      });
      AppState.removeEventListener('change', onAppStateChanged);
      Appearance.removeChangeListener(SettingsService.setTheme);
      Linking.removeEventListener('url', onUrlRecieved);
      //unsub();
      unsubIAP();
    };
  }, []);

  useEffect(() => {
    SettingsService.init().then((r) => console.log);
    dispatch({
      type: Actions.DEVICE_MODE,
      state: DDS.isLargeTablet()
        ? 'tablet'
        : DDS.isSmallTab
        ? 'smallTablet'
        : 'mobile',
    });
    db.init().catch(console.log).finally(loadMainApp);
  }, []);

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
    let user = await db.user.fetchUser(true);
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

  const attachIAPListeners = () => {
    if (Platform.OS === 'ios') {
      RNIap.getReceiptIOS()
        .then((r) => {
          hasPurchased = true;
          processReceipt(r);
        })
        .catch(console.log)
        .finally(() => {
          subsriptionSuccessListerner = RNIap.purchaseUpdatedListener(
            onSuccessfulSubscription,
          );
          subsriptionErrorListener = RNIap.purchaseErrorListener(
            onSubscriptionError,
          );
        });
    } else {
      subsriptionSuccessListerner = RNIap.purchaseUpdatedListener(
        onSuccessfulSubscription,
      );
      subsriptionErrorListener = RNIap.purchaseErrorListener(
        onSubscriptionError,
      );
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
    if (subsriptionSuccessListerner) {
      subsriptionSuccessListerner?.remove();
      subsriptionSuccessListerner = null;
    }
    if (subsriptionErrorListener) {
      subsriptionErrorListener?.remove();
      subsriptionErrorListener = null;
    }
  };

  const loadMainApp = () => {
    dispatch({type: Actions.ALL});
    setCurrentUser().then(console.log).catch(console.log);
    Backup.checkAndRun().then((r) => r);
    sleep(500).then(() => {
      setAppIsInitialized(true);
      SplashScreen.hide();
    });
    db.notes.init().then(() => {
      dispatch({type: Actions.NOTES});
      dispatch({type: Actions.FAVORITES});
      eSendEvent(refreshNotesPage);
      dispatch({type: Actions.LOADING, loading: false});
      SettingsService.setAppLoaded();
    });
    Linking.getInitialURL().then(async (url) => {
      if (url && url.startsWith('https://app.notesnook.com/account/verified')) {
        await onEmailVerified();
      }
    });
    sleep(300).then(() => {
      eSendEvent(eOpenSideMenu);
      db.version()
        .then((ver) => {
          if (ver.mobile > APP_VERSION) {
            eSendEvent('updateDialog', ver);
          }
        })
        .catch(console.log);
    });

    //Sentry = require('@sentry/react-native');
    // Sentry.init({
    //   dsn:
    //     'https://317a5c31caf64d1e9b27abf15eb1a554@o477952.ingest.sentry.io/5519681',
    // });
  };

  const setCurrentUser = async () => {
    try {
      let user = await db.user.fetchUser(true);
      if (user) {
        clearMessage(dispatch);
        if (!user.isEmailConfirmed) {
          setEmailVerifyMessage(dispatch);
        }
        dispatch({type: Actions.USER, user: user});
        await PremiumService.setPremiumStatus();
        await Sync.run();
        await startSyncer();
      } else {
        await PremiumService.setPremiumStatus();
        setLoginMessage(dispatch);
      }
    } catch (e) {}
  };

  const onSuccessfulSubscription = (subscription) => {
    if (hasPurchased) {
      return;
    }
    const receipt = subscription.transactionReceipt;
    processReceipt(receipt);

    setTimeout(() => {
      eSendEvent(eClosePremiumDialog);
      eSendEvent(eOpenPendingDialog);
    }, 500);
  };

  const onSubscriptionError = (error) => {};

  const processReceipt = (receipt) => {
    return;
    if (receipt) {
      if (Platform.OS === 'ios') {
        fetch('http://192.168.10.5:8100/webhooks/assn', {
          method: 'POST',
          body: JSON.stringify({
            receipt_data: receipt,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
          .then((r) => {
            console.log(r.status, 'STATUS');
          })
          .catch((e) => {
            console.log(e, 'ERROR');
          });
      }
    }
  };

  return (
    <SafeAreaProvider>
      <RootView />
      <EditorRoot />
    </SafeAreaProvider>
  );
};

export default App;
