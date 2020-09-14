import {useNetInfo} from '@react-native-community/netinfo';
import React, {useEffect, useState} from 'react';
import {Appearance, StatusBar, useColorScheme, AppState} from 'react-native';
import Orientation from 'react-native-orientation';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {getColorScheme, scale, updateSize} from './src/common/common';
import {useTracked} from './src/provider';
import {ACTIONS} from './src/provider/actions';
import {defaultState} from './src/provider/defaultState';
import {eSubscribeEvent, eUnSubscribeEvent} from './src/services/eventManager';
import {eDispatchAction, eResetApp, eStartSyncer} from './src/services/events';
import {MMKV} from './src/utils/storage';
import {db, DDS, ToastEvent} from './src/utils/utils';

let theme;
const App = () => {
  const [, dispatch] = useTracked();
  const [init, setInit] = useState(false);
  const netInfo = useNetInfo();
  const colorScheme = useColorScheme();
  const I = DDS.isTab ? require('./index.tablet') : require('./index.mobile');
  const _onOrientationChange = (o) => {
    // Currently orientation is locked on tablet.
    /* DDS.checkOrientation();
    setTimeout(() => {
      forceUpdate();
    }, 1000); */
  }

  useEffect(() => {
    changeTheme();
  }, [colorScheme]);

  const changeTheme = async () => {
    let settings;
    try {
      settings = await MMKV.getStringAsync('settings');
    } catch (e) {}
    if (!settings) {
      return;
    }
    settings = JSON.parse(settings);
    console.log(settings.useSystemTheme)
    if (settings.useSystemTheme) {
      let newColors = await getColorScheme(settings.useSystemTheme);
      StatusBar.setBarStyle(
        Appearance.getColorScheme() === 'dark'
          ? 'light-content'
          : 'dark-content',
      );

      dispatch({type: ACTIONS.THEME, colors: newColors});
    }
  };

  useEffect(() => {
    if (!netInfo.isConnected || !netInfo.isInternetReachable) {
      db.user?.get().then((user) => {
        if (user) {
          ToastEvent.show('No internet connection', 'error');
        } else {
        }
      });
    } else {
      db.user?.get().then((user) => {
        if (user) {
          ToastEvent.show('Internet connection restored', 'success');
        } else {
        }
      });
    }
  }, [netInfo]);

  useEffect(() => {
    Orientation.addOrientationListener(_onOrientationChange);
    eSubscribeEvent(eDispatchAction, (type) => {
      dispatch(type);
    });
    return () => {
      eUnSubscribeEvent(eDispatchAction, (type) => {
        dispatch(type);
      });
      Orientation.removeOrientationListener(_onOrientationChange);
    };
  }, []);

  useEffect(() => {
    DDS.isTab ? Orientation.lockToLandscape() : Orientation.lockToPortrait();
  }, []);

  const startSyncer = async () => {
    let user = await db.user.get();
    if (user) {
      db.ev.subscribe('sync', _syncFunc);
    }
  };

  const _syncFunc = async () => {
    dispatch({type: ACTIONS.SYNCING, syncing: true});
    let user = await db.user.get();
    try {
      await db.sync();
    } catch (e) {}
    user = await db.user.get();
    dispatch({type: ACTIONS.USER, user: user});
    dispatch({type: ACTIONS.ALL});
    dispatch({type: ACTIONS.SYNCING, syncing: false});
  };

  const resetApp = () => {
    setInit(false);
    Initialize().then(() => {
      setInit(true);
    });
  };

  useEffect(() => {
    eSubscribeEvent(eStartSyncer, startSyncer);
    eSubscribeEvent(eResetApp, resetApp);
    return () => {
      db.ev.unsubscribe('sync', _syncFunc);
      eUnSubscribeEvent(eStartSyncer, startSyncer);
      eUnSubscribeEvent(eResetApp, resetApp);
    };
  }, []);

  useEffect(() => {
    Initialize().then(() => {
      db.init().then(async () => {
        let user = await db.user.get();
        dispatch({type: ACTIONS.USER, user: user});
        console.log(user);
        startSyncer();
        dispatch({type: ACTIONS.ALL});
        setInit(true);
      });
    });
  }, []);

  async function Initialize(colors = colors) {
    let settings;
    try {
      settings = await MMKV.getStringAsync('settings');
    } catch (e) {}
    if (!settings) {
      settings = defaultState.settings;
      settings = JSON.stringify(settings);
      settings.fontScale = 1;

      await MMKV.setStringAsync('settings', settings);

      dispatch({type: ACTIONS.SETTINGS, settings});
    } else {
      settings = JSON.parse(settings);
      if (settings.fontScale) {
        scale.fontScale = settings.fontScale;
      } else {
        scale.fontScale = 1;
      }
      updateSize();
      dispatch({type: ACTIONS.SETTINGS, settings: {...settings}});
    }

    let newColors = await getColorScheme(settings.useSystemTheme);

    dispatch({type: ACTIONS.THEME, colors: newColors});
  }

  if (!init) {
    return <></>;
  }
  return (
    <>
      <SafeAreaProvider>
        <>
          <I.Initialize />
        </>
      </SafeAreaProvider>
    </>
  );
};

export default App;
