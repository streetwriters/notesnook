import React, {useEffect, useState} from 'react';
import Orientation from 'react-native-orientation';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {getColorScheme, scale, updateSize} from './src/common/common';
import {useTracked} from './src/provider';
import {ACTIONS} from './src/provider/actions';
import {defaultState} from './src/provider/defaultState';
import {eSubscribeEvent, eUnSubscribeEvent} from './src/services/eventManager';
import {eDispatchAction, eStartSyncer, eResetApp} from './src/services/events';
import {db, DDS, ToastEvent} from './src/utils/utils';
import {useNetInfo} from '@react-native-community/netinfo';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { MMKV } from './src/utils/storage';
import {
  Appearance,
  useColorScheme,
  StatusBar} from "react-native";
const App = () => {
  const [state, dispatch] = useTracked();
  const [init, setInit] = useState(false);
  const netInfo = useNetInfo();
  const colorScheme = useColorScheme();
  const I = DDS.isTab ? require('./index.tablet') : require('./index.mobile');
  const _onOrientationChange = o => {
    // Currently orientation is locked on tablet.
    /* DDS.checkOrientation();
    setTimeout(() => {
     
      forceUpdate();
    }, 1000); */
  };

  useEffect(() => {
    systemThemeChange();
  
  },[colorScheme])


  const systemThemeChange = async () => {
    let s;
    try {
      s = await MMKV.getStringAsync('settings');
    } catch (e) {
    }
    console.log("HEREE");
    console.log('heree');
    if (!s) return;
    s = JSON.parse(s);
    console.log(s);
    if (s.useSystemTheme) {
      let newColors = await getColorScheme(s.useSystemTheme);
      StatusBar.setBarStyle(Appearance.getColorScheme() === "dark" ? 'light-content' : 'dark-content');
      dispatch({type: ACTIONS.THEME, colors: newColors});
    }
  }

  useEffect(() => {
    if (!netInfo.isConnected || !netInfo.isInternetReachable) {
      db.user?.get().then(user => {
        if (user) {
          ToastEvent.show('No internet connection', 'error');
        } else {
        }
      });
    } else {
      db.user?.get().then(user => {
        if (user) {
          ToastEvent.show('Internet connection restored', 'success');
        } else {
        }
      });
    }
  }, [netInfo]);

  useEffect(() => {
    Orientation.addOrientationListener(_onOrientationChange);
    eSubscribeEvent(eDispatchAction, type => {
      dispatch(type);
    });
    return () => {
      eUnSubscribeEvent(eDispatchAction, type => {
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
    let u = await db.user.get();
    try {
      await db.sync();
    } catch (e) {}
    u = await db.user.get();
    dispatch({type: ACTIONS.USER, user: u});
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

    let s;
    try {
      s = await MMKV.getStringAsync('settings');
    } catch (e) {}
    if (typeof s !== 'string') {
      s = defaultState.settings;
      s = JSON.stringify(s);
      s.fontScale = 1;

      await MMKV.setStringAsync('settings', s);

      dispatch({type: ACTIONS.SETTINGS, s});
    } else {
      s = JSON.parse(s);
      if (s.fontScale) {
        scale.fontScale = s.fontScale;
      } else {
        scale.fontScale = 1;
      }
      updateSize();
      dispatch({type: ACTIONS.SETTINGS, settings: {...s}});
    }

    let newColors = await getColorScheme(s.useSystemTheme);
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
