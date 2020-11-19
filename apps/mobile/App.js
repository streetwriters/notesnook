import * as NetInfo from '@react-native-community/netinfo';
import * as Sentry from '@sentry/react-native';
import {EV} from 'notes-core/common';
import React, {useEffect, useState} from 'react';
import {Appearance, AppState, Platform, StatusBar} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import Orientation from 'react-native-orientation';
import {enabled} from 'react-native-privacy-snapshot';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import SplashScreen from 'react-native-splash-screen';
import {useTracked} from './src/provider';
import {Actions} from './src/provider/Actions';
import Backup from './src/services/Backup';
import {DDS} from './src/services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent,
} from './src/services/EventManager';
import IntentService from './src/services/IntentService';
import {setLoginMessage} from './src/services/Message';
import SettingsService from './src/services/SettingsService';
import {COLOR_SCHEME} from './src/utils/Colors';
import {db} from './src/utils/DB';
import {
  eDispatchAction,
  eOnLoadNote,
  eResetApp,
  eStartSyncer,
} from './src/utils/Events';
import {MMKV} from './src/utils/mmkv';
import {tabBarRef} from './src/utils/Refs';
import {getDeviceSize} from './src/utils/SizeUtils';
import {sleep} from './src/utils/TimeUtils';
import {getNote} from './src/views/Editor/Functions';

Sentry.init({
  dsn:
    'https://317a5c31caf64d1e9b27abf15eb1a554@o477952.ingest.sentry.io/5519681',
});

let firstLoad = true;
let note = null;

const onAppStateChanged = async (state) => {
  if (state === 'active') {
    console.log("active state");
    StatusBar.setBarStyle(
      COLOR_SCHEME.night ? 'light-content' : 'dark-content',true
    );
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor("transparent",true)
      StatusBar.setTranslucent(true,true);
    }
    if (SettingsService.get().privacyScreen) {
      enabled(false);
    }
  } else {
    if (SettingsService.get().privacyScreen) {
      enabled(true);
    }
  }
};

const onNetworkStateChanged = (netInfo) => {
  let message = 'Internet connection restored';
  let type = 'success';
  if (!netInfo.isConnected || !netInfo.isInternetReachable) {
    message = 'No internet connection';
    type = 'error';
  }
  db.user?.get().then((user) => {
    if (user) {
      ToastEvent.show(message, type);
    }
  });
};

const App = () => {
  const [, dispatch] = useTracked(),
    [init, setInit] = useState(false);

  let I =
    DDS.isLargeTablet()
      ? require('./index.tablet')
      : require('./index.mobile');

  const _onOrientationChange = (o) => {
    let smallTab = DDS.isSmallTab;
    DDS.setNewValues();
    DDS.checkSmallTab(o);
    if (smallTab === DDS.isSmallTab) {
      return;
    }
    I =
     DDS.isLargeTablet()
        ? require('./index.tablet')
        : require('./index.mobile');

    setTimeout(() => {
      resetApp();
    }, 1000);
  };
  const syncChanges = async () => {
      dispatch({type: Actions.ALL});
    },
    resetApp = async () => {
      note = getNote();
      setInit(false);
      Initialize();
      setInit(true);
      await sleep(300);
      if (note && note.id) {
        eSendEvent(eOnLoadNote, note);
        if (DDS.isPhone || DDS.isSmallTab) {
          tabBarRef.current?.goToPage(1);
        }
        note = null;
      }
    },
    startSyncer = async () => {
      try {
        let user = await db.user.get();
        if (user) {
          EV.subscribe('db:refresh', syncChanges);
        }
      } catch (e) {
        console.log(e);
      }
    };

  const onSystemThemeChanged = async () => {
    await SettingsService.setTheme();
  };

  useEffect(() => {
    eSubscribeEvent(eStartSyncer, startSyncer);
    eSubscribeEvent(eResetApp, resetApp);
    Orientation.addOrientationListener(_onOrientationChange);
    eSubscribeEvent(eDispatchAction, (type) => {
      dispatch(type);
    });
    AppState.addEventListener('change', onAppStateChanged);
    Appearance.addChangeListener(onSystemThemeChanged);
    let unsub = NetInfo.addEventListener(onNetworkStateChanged);
    return () => {
      EV.unsubscribe('db:refresh', syncChanges);
      eUnSubscribeEvent(eStartSyncer, startSyncer);
      eUnSubscribeEvent(eResetApp, resetApp);
      eUnSubscribeEvent(eDispatchAction, (type) => {
        dispatch(type);
      });
      Orientation.removeOrientationListener(_onOrientationChange);
      AppState.removeEventListener('change', onAppStateChanged);
      Appearance.removeChangeListener(onSystemThemeChanged);
      unsub();
    };
  }, []);

  const getUser = async () => {
    let user = await db.user.get();
    if (user) {
      dispatch({type: Actions.USER, user: user});
      dispatch({type: Actions.SYNCING, syncing: true});
      await db.sync();
      dispatch({type: Actions.SYNCING, syncing: false});
      dispatch({type: Actions.ALL});
      await startSyncer();
    } else {
      setLoginMessage(dispatch);
    }
  };

  useEffect(() => {
    Initialize();
    let error = null;
    (async () => {
      try {
        await db.init();

        console.log('db is initialized');
      } catch (e) {
        error = e;
        console.log(e, 'ERROR DB');
      } finally {
        dispatch({type: Actions.ALL});
        getUser().catch((e) => console.log);
        backupData().then((r) => r);
      }
      setInit(true);
      setTimeout(() => {
        if (error) {
          console.log(error);
          ToastEvent.show('Error initializing database.');
        }
        IntentService.check();
        SplashScreen.hide();
      }, 100);
    })();
  }, []);

  async function backupData() {
    await sleep(1000);
    let settings = await MMKV.getStringAsync('settings');
    settings = JSON.parse(settings);
    if (await Backup.checkBackupRequired(settings.reminder)) {
      try {
        await Backup.run();
      } catch (e) {
        console.log(e);
      }
    }
  }

  function Initialize() {
    if (firstLoad) {
      if (DDS.isLargeTablet()) {
        Orientation.lockToLandscape();
        _onOrientationChange('LANDSCAPE');
      } else {
        Orientation.lockToPortrait();
      }
      firstLoad = false;
    }
    SettingsService.init().then((r) => r);
  }

  return (
    <>
      <SafeAreaProvider>
        <>{!init ? <></> : <I.Initialize />}</>
      </SafeAreaProvider>
    </>
  );
};

export default App;
