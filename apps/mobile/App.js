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
import {useTracked} from './src/provider';
import {Actions} from './src/provider/Actions';
import Backup from './src/services/Backup';
import {DDS} from './src/services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from './src/services/EventManager';
import IntentService from './src/services/IntentService';
import {
  clearMessage,
  setEmailVerifyMessage,
  setLoginMessage,
} from './src/services/Message';
import Navigation from './src/services/Navigation';
import PremiumService from './src/services/PremiumService';
import SettingsService from './src/services/SettingsService';
import Sync from './src/services/Sync';
import {
  APP_VERSION,
  editing,
  getAppIsIntialized,
  getIntentOnAppLoadProcessed,
  setAppIsInitialized,
  setIntentOnAppLoadProcessed,
} from './src/utils';
import {COLOR_SCHEME} from './src/utils/Colors';
import {db} from './src/utils/DB';
import {
  eClosePremiumDialog,
  eCloseProgressDialog,
  eDispatchAction,
  eOnLoadNote,
  eOpenLoginDialog,
  eOpenPendingDialog,
  eOpenProgressDialog,
  eOpenSideMenu,
  refreshNotesPage,
} from './src/utils/Events';
import {MMKV} from './src/utils/mmkv';
import {tabBarRef} from './src/utils/Refs';
import {sleep} from './src/utils/TimeUtils';
import {getNote, setIntent} from './src/views/Editor/Functions';
const {ReceiveSharingIntent} = NativeModules;

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
    }
    try {
      if (getIntentOnAppLoadProcessed()) {
        if (Platform.OS === 'android') {
          let intent = await ReceiveSharingIntent.getFileNames();
          if (intent) {
            IntentService.setIntent(intent);
            IntentService.check(loadIntent);
          }
        }
      } else {
        if (!db || !db.notes) return;
        if (!getNote()) {
          eSendEvent('nointent');
        } else {
          SplashScreen.hide();
        }
      }
    } catch (e) {}
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

function loadIntent(event) {
  if (event) {
    setIntent();
    eSendEvent(eOnLoadNote, event);
    tabBarRef.current?.goToPage(1);
    Navigation.closeDrawer();
  } else {
    eSendEvent('nointent');
    SplashScreen.hide();
    sleep(300).then(() => eSendEvent(eOpenSideMenu));
  }
}

const onNetworkStateChanged = (netInfo) => {
  /*  let message = 'Internet connection restored';
  let type = 'success';
  if (!netInfo.isConnected || !netInfo.isInternetReachable) {
    message = 'No internet connection';
    type = 'error';
  }
  db.user?.get().then((user) => {
    if (user && intentOnAppLoadProcessed) {
      ToastEvent.show(message, type);
    }
  }); */
};

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
    eSubscribeEvent('nointent', loadMainApp);
    Appearance.addChangeListener(SettingsService.setTheme);
    let unsub = NetInfo.addEventListener(onNetworkStateChanged);
    Linking.addEventListener('url', onUrlRecieved);
    EV.subscribe('db:refresh', onSyncComplete);
    EV.subscribe('db:sync', partialSync);
    EV.subscribe('user:loggedOut', onLogout);
    EV.subscribe('user:checkStatus', PremiumService.onUserStatusCheck);
    return () => {
      EV.subscribe('db:refresh', onSyncComplete);
      EV.unsubscribe('user:loggedOut', onLogout);
      EV.unsubscribe('db:sync', partialSync);
      EV.unsubscribe('user:checkStatus', PremiumService.onUserStatusCheck);
      eUnSubscribeEvent(eDispatchAction, (type) => {
        dispatch(type);
      });
      eUnSubscribeEvent('nointent', loadMainApp);
      AppState.removeEventListener('change', onAppStateChanged);
      Appearance.removeChangeListener(SettingsService.setTheme);
      Linking.removeEventListener('url', onUrlRecieved);
      unsub();
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
    db.init().catch(console.log).finally(runAfterInit);
  }, []);

  const onSyncComplete = async () => {
    dispatch({type: Actions.ALL});
    dispatch({type: Actions.LAST_SYNC, lastSync: await db.lastSynced()});
  };

  const onUrlRecieved = async (res) => {
    if (getIntentOnAppLoadProcessed()) {
      let url = res ? res.url : '';
      try {
        if (Platform.OS === 'ios' && url.startsWith('ShareMedia://dataUrl')) {
          let intent = await ReceiveSharingIntent.getFileNames(url);
          intent = IntentService.iosSortedData(intent);

          if (intent) {
            IntentService.setIntent(intent);
            IntentService.check(loadIntent);
          }
        } else if (
          url.startsWith('https://app.notesnook.com/account/verified')
        ) {
          await onEmailVerified();
        } else {
          return;
        }
      } catch (e) {}
    }
  };

  const onEmailVerified = async () => {
    let user = await db.user.fetchUser(true);
    dispatch({type: Actions.USER, user: user});
    if (!user) return;
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

  const onLogout = (reason) => {
    dispatch({type: Actions.USER, user: null});
    dispatch({type: Actions.CLEAR_ALL});
    dispatch({type: Actions.SYNCING, syncing: false});
    setLoginMessage(dispatch);
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
    dispatch({type: Actions.INTENT_MODE, state: false});
    dispatch({type: Actions.ALL});
    setCurrentUser().then(console.log).catch(console.log);
    Backup.checkAndRun().then((r) => r);
    sleep(500).then(() => setAppIsInitialized(true));
    db.notes.init().then(() => {
      dispatch({type: Actions.NOTES});
      dispatch({type: Actions.FAVORITES});
      eSendEvent(refreshNotesPage);
      dispatch({type: Actions.LOADING, loading: false});
      SettingsService.setAppLoaded();
    });
    SplashScreen.hide();
    Linking.getInitialURL().then(async (url) => {
      if (url && url.startsWith('https://notesnook.com')) {
        await onEmailVerified();
      }
    });
    setIntentOnAppLoadProcessed(true);
    sleep(300).then(() => {
      eSendEvent(eOpenSideMenu);
      db.version()
        .then((ver) => {
          console.log(ver,'version');
          if (ver.mobile > APP_VERSION - 1) {
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
      let user = await db.user.getUser(true);
      if (user) {
        clearMessage(dispatch);
        if (!user.isEmailConfirmed) {
          setEmailVerifyMessage(dispatch);
        }
        dispatch({type: Actions.USER, user: user});
        await Sync.run();
        await startSyncer();
      } else {
        setLoginMessage(dispatch);
      }
    } catch (e) {}
  };

  const runAfterInit = () => {
    let isIntent = false;
    IntentService.getIntent()
      .then(() => {
        IntentService.check((event) => {
          SplashScreen.hide();
          loadIntent(event);
          setIntentOnAppLoadProcessed(true);
          dispatch({type: Actions.ALL});
          isIntent = true;
          dispatch({type: Actions.INTENT_MODE, state: true});
          ReceiveSharingIntent.clearFileNames();
        });
      })
      .catch((e) => console.log)
      .finally(() => {
        if (!isIntent) {
          dispatch({type: Actions.INTENT_MODE, state: false});
          ReceiveSharingIntent.clearFileNames();
          setIntentOnAppLoadProcessed(true);
          loadMainApp();
        }
      });
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
    </SafeAreaProvider>
  );
};

export default App;
