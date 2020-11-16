import * as NetInfo from '@react-native-community/netinfo';
import { EV } from 'notes-core/common';
import React, { useEffect, useState } from 'react';
import {
  Appearance, AppState,
  Platform,
  StatusBar
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import Orientation from 'react-native-orientation';
import { enabled } from 'react-native-privacy-snapshot';
import ReceiveSharingIntent from 'react-native-receive-sharing-intent';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SplashScreen from 'react-native-splash-screen';
import { useTracked } from './src/provider';
import { Actions } from './src/provider/Actions';
import { defaultState } from './src/provider/DefaultState';
import Backup from './src/services/Backup';
import { DDS } from './src/services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent
} from './src/services/EventManager';
import { setLoginMessage } from './src/services/Message';
import { AndroidModule, sortSettings } from './src/utils';
import { COLOR_SCHEME } from './src/utils/Colors';
import { getColorScheme } from './src/utils/ColorUtils';
import { db } from './src/utils/DB';
import {
  eDispatchAction,
  eOnLoadNote,
  eResetApp,
  eStartSyncer
} from './src/utils/Events';
import { MMKV } from './src/utils/mmkv';
import { tabBarRef } from './src/utils/Refs';
import { getDeviceSize, scale, updateSize } from './src/utils/SizeUtils';
import { sleep } from './src/utils/TimeUtils';
import { getNote, setIntent } from './src/views/Editor/Functions';
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
  let settings = await MMKV.getStringAsync('settings');
  if (settings) {
    settings = JSON.parse(settings);
  }
  if (settings.privacyScreen) {
    enabled(false);
  }
};

const onAppBlur = async () => {
  let settings = await MMKV.getStringAsync('settings');
  if (settings) {
    settings = JSON.parse(settings);
  }
  if (settings.privacyScreen) {
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

  const updateTheme = async () => {
    let settings;
    settings = await MMKV.getStringAsync('settings');
    if (settings) {
      settings = JSON.parse(settings);
      let newColors = await getColorScheme(settings.useSystemTheme);
      dispatch({type: Actions.THEME, colors: newColors});
    }
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
    updateTheme().then((r) => r);
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
      } catch (e) {
        error = e;
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
        checkForIntent();
        SplashScreen.hide();
      }, 100);
    })();
  }, []);

  const checkForIntent = () => {
    ReceiveSharingIntent.getReceivedFiles(
      (d) => {
        let data = d[0];
        if (data.text || data.weblink) {
          let text = data.text;
          let weblink = data.weblink;
          let delta = null;

          if (weblink && text) {
            delta = [{insert: `${text + ' ' + weblink}`}];
            text = data.text + ' ' + data.weblink;
          } else if (text && !weblink) {
            delta = [{insert: `${text}`}];
            text = data.text;
          } else if (weblink) {
            delta = [{insert: `${weblink}`}];
            text = weblink;
          }

          prevIntent.text = text;
          prevIntent.weblink = weblink;
          setIntent();
          eSendEvent(eOnLoadNote, {
            type: 'intent',
            data: delta,
            text: text,
          });
          if (DDS.isPhone || DDS.isSmallTab) {
            tabBarRef.current?.goToPage(1);
          }
        }
        ReceiveSharingIntent.clearReceivedFiles();
      },
      (error) => {
        console.log(error, 'INTENT ERROR');
      },
    );
  };

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
    initAppSettings().catch((e) => console.log(e));
  }

  const initAppSettings = async () => {
    let settings;
    scale.fontScale = 1;
    settings = await MMKV.getStringAsync('settings');
    if (!settings) {
      settings = defaultState.settings;
      await MMKV.setStringAsync('settings', JSON.stringify(settings));
    } else {
      settings = JSON.parse(settings);
    }
    if (settings.fontScale) {
      scale.fontScale = settings.fontScale;
    }
    if (settings.privacyScreen) {
      AndroidModule.setSecureMode(true);
    } else {
      AndroidModule.setSecureMode(false);
    }
    sortSettings.sort = settings.sort;
    sortSettings.sortOrder = settings.sortOrder;
    dispatch({type: Actions.SETTINGS, settings: {...settings}});
    updateSize();
    await updateTheme();
  };
  return (
    <>
      <SafeAreaProvider>
        <>{!init ? <></> : <I.Initialize />}</>
      </SafeAreaProvider>
    </>
  );
};

export default App;
