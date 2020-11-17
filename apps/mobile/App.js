import * as NetInfo from '@react-native-community/netinfo';
import {EV} from 'notes-core/common';
import React, {useEffect, useState} from 'react';
import {Appearance, AppState, Platform, StatusBar} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import Orientation from 'react-native-orientation';
import {enabled} from 'react-native-privacy-snapshot';
import ReceiveSharingIntent from 'react-native-receive-sharing-intent';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import SplashScreen from 'react-native-splash-screen';
import {useTracked} from './src/provider';
import {Actions} from './src/provider/Actions';
import {defaultState} from './src/provider/DefaultState';
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
import {AndroidModule, sortSettings} from './src/utils';
import {COLOR_SCHEME} from './src/utils/Colors';
import {getColorScheme} from './src/utils/ColorUtils';
import {db} from './src/utils/DB';
import {
  eDispatchAction,
  eOnLoadNote,
  eResetApp,
  eStartSyncer,
} from './src/utils/Events';
import {MMKV} from './src/utils/mmkv';
import {tabBarRef} from './src/utils/Refs';
import {getDeviceSize, scale, updateSize} from './src/utils/SizeUtils';
import {sleep} from './src/utils/TimeUtils';
import {getNote, setIntent} from './src/views/Editor/Functions';

import * as Sentry from '@sentry/react-native';

Sentry.init({ 
  dsn: 'https://317a5c31caf64d1e9b27abf15eb1a554@o477952.ingest.sentry.io/5519681', 
});

let firstLoad = true;
let note = null;
let prevIntent = {
  text: null,
  weblink: null,
};

const onAppFocused = async () => {
  StatusBar.setBarStyle(COLOR_SCHEME.night ? 'light-content' : 'dark-content');
  if (Platform.OS === 'android') {
    StatusBar.setTranslucent(true);
    StatusBar.setBackgroundColor(COLOR_SCHEME.bg);
  }
  if (SettingsService.get().privacyScreen) {
    enabled(false);
  }
};

const onAppBlur = async () => {
  if (SettingsService.get().privacyScreen) {
    enabled(true);
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
    DDS.isTab && !DDS.isSmallTab
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
      DDS.isTab && !DDS.isSmallTab
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
    AppState.addEventListener('focus', onAppFocused);
    AppState.addEventListener('blur', onAppBlur);
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
      AppState.removeEventListener('focus', onAppFocused);
      AppState.removeEventListener('blur', onAppBlur);
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

        console.log("db is initialized");
      } catch (e) {
        error = e;
        console.log(e,"ERROR DB")
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
      if (DeviceInfo.isTablet() && getDeviceSize() > 9) {
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
