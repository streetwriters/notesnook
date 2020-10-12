import {useNetInfo} from '@react-native-community/netinfo';
import React, {useEffect, useState} from 'react';
import {Dimensions, useColorScheme} from 'react-native';
import Orientation from 'react-native-orientation';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {
  getColorScheme,
  getDeviceSize,
  scale,
  updateSize,
} from './src/common/common';
import {useTracked} from './src/provider';
import {ACTIONS} from './src/provider/actions';
import {defaultState} from './src/provider/defaultState';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from './src/services/eventManager';
import {
  eDispatchAction,
  eOnLoadNote,
  eResetApp,
  eStartSyncer,
} from './src/services/events';
import {MMKV} from './src/utils/storage';
import {db, DDS, sleep, ToastEvent} from './src/utils/utils';
import DeviceInfo from 'react-native-device-info';
import {getNote} from './src/views/Editor/func';
import {openEditorAnimation} from './src/utils/animations';

let firstLoad = true;
let note = null;
const App = () => {
  const [, dispatch] = useTracked();
  const [init, setInit] = useState(false);
  const netInfo = useNetInfo();
  const colorScheme = useColorScheme();
  let I =
    DDS.isTab && !DDS.isSmallTab
      ? require('./index.tablet')
      : require('./index.mobile');

  const _onOrientationChange = (o) => {
    console.log(o, 'orientation');
    let smallTab = DDS.isSmallTab;
    DDS.setNewValues();
    DDS.checkSmallTab(o);
    if (smallTab === DDS.isSmallTab) {
      console.log('nothing changed');
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

  useEffect(() => {
    updateTheme();
  }, [colorScheme]);

  const updateTheme = async () => {
    let settings;
    try {
      settings = await MMKV.getStringAsync('settings');
    } catch (e) {
      console.log(e.message);
    } finally {
      if (!settings) {
        return;
      }
      settings = JSON.parse(settings);
      if (settings.useSystemTheme) {
        let newColors = await getColorScheme(settings.useSystemTheme);
        dispatch({type: ACTIONS.THEME, colors: newColors});
      }
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

  const startSyncer = async () => {
    try {
      let user = await db.user.get();
      if (user) {
        db.ev.subscribe('db:refresh', syncChanges);
      }
    } catch (e) {
      console.log(e);
    }
  };
  const syncChanges = async () => {
    dispatch({type: ACTIONS.ALL});
  };

  const resetApp = () => {
    note = getNote();
    console.log(note, 'NOTE BEFORE RELOAD');
    setInit(false);
    Initialize().then(async () => {
      setInit(true);
      await sleep(300);
      console.log(note, 'NOTE ON RELOAD');
      if (note && note.id) {
        console.log(note);
        eSendEvent(eOnLoadNote, note);
        if (DDS.isPhone || DDS.isSmallTab) {
          openEditorAnimation();
        }
        note = null;
      }
    });
  };

  useEffect(() => {
    eSubscribeEvent(eStartSyncer, startSyncer);
    eSubscribeEvent(eResetApp, resetApp);
    Orientation.addOrientationListener(_onOrientationChange);
    eSubscribeEvent(eDispatchAction, (type) => {
      dispatch(type);
    });
    return () => {
      db?.ev?.unsubscribe('db:refresh', syncChanges);
      eUnSubscribeEvent(eStartSyncer, startSyncer);
      eUnSubscribeEvent(eResetApp, resetApp);
      eUnSubscribeEvent(eDispatchAction, (type) => {
        dispatch(type);
      });
      Orientation.removeOrientationListener(_onOrientationChange);
    };
  }, []);

  useEffect(() => {
    let error = null;
    let user;

    Initialize().finally(async () => {
      try {
        await db.init();
        user = await db.user.get();
      } catch (e) {
        error = e;
        console.log(e,"ERROR IN DB")
      } finally {
        if (user) {
          dispatch({type: ACTIONS.USER, user: user});
          startSyncer();
        }
        dispatch({type: ACTIONS.ALL});

        setInit(true);

        if (error) {
          setTimeout(() => {
            ToastEvent.show(error.message);
          }, 500);
        }
      }
    });
  }, []);

  async function Initialize(colors = colors) {
    let settings;
    scale.fontScale = 1;

    if (firstLoad) {
      if (DeviceInfo.isTablet() && getDeviceSize() > 9) {
        Orientation.lockToLandscape();
        _onOrientationChange('LANDSCAPE');
      } else {
        Orientation.lockToPortrait();
      }
      firstLoad = false;
    }

    try {
      settings = await MMKV.getStringAsync('settings');
      settings = JSON.parse(settings);

      if (settings.fontScale) {
        scale.fontScale = settings.fontScale;
      }
      updateSize();
    } catch (e) {
      if (!settings || !settings.includes('fontScale')) {
        settings = defaultState.settings;
        await MMKV.setStringAsync('settings', JSON.stringify(settings));
      }
    } finally {
      let newColors = await getColorScheme(settings.useSystemTheme);
      dispatch({type: ACTIONS.SETTINGS, settings: {...settings}});
      dispatch({type: ACTIONS.THEME, colors: newColors});
    }
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
