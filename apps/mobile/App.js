import {useNetInfo} from '@react-native-community/netinfo';
import React, {useEffect, useState} from 'react';
import {useColorScheme} from 'react-native';
import Orientation from 'react-native-orientation';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {useTracked} from './src/provider';
import {Actions} from './src/provider/Actions';
import {defaultState} from './src/provider/DefaultState';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent,
} from './src/services/EventManager';
import {
  eDispatchAction,
  eOnLoadNote,
  eResetApp,
  eStartSyncer,
} from './src/utils/Events';
import DeviceInfo from 'react-native-device-info';
import {getNote} from './src/views/Editor/Functions';
import {openEditorAnimation} from './src/utils/Animations';
import {sleep} from './src/utils/TimeUtils';
import {getColorScheme} from './src/utils/ColorUtils';
import {getDeviceSize, scale, updateSize} from './src/utils/SizeUtils';
import {db} from './src/utils/DB';
import {DDS} from './src/services/DeviceDetection';
import {MMKV} from './src/utils/mmkv';
import Backup from './src/services/Backup';
import {setLoginMessage} from './src/services/Message';
import SplashScreen from 'react-native-splash-screen';

let firstLoad = true;
let note = null;
const App = () => {
  const [, dispatch] = useTracked(),
    [init, setInit] = useState(false),
    netInfo = useNetInfo(),
    colorScheme = useColorScheme();
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

  useEffect(() => {
    updateTheme().then((r) => r);
  }, [colorScheme]);

  const updateTheme = async () => {
    let settings;
    settings = await MMKV.getStringAsync('settings');
    if (settings) {
      settings = JSON.parse(settings);
      if (settings.useSystemTheme) {
        let newColors = await getColorScheme(settings.useSystemTheme);
        dispatch({type: Actions.THEME, colors: newColors});
      }
    }
  };

  useEffect(() => {
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
  }, [netInfo]);

  const syncChanges = async () => {
      dispatch({type: Actions.ALL});
    },
    resetApp = () => {
      note = getNote();
      setInit(false);
      Initialize().then(async () => {
        setInit(true);
        await sleep(300);
        if (note && note.id) {
          eSendEvent(eOnLoadNote, note);
          if (DDS.isPhone || DDS.isSmallTab) {
            openEditorAnimation();
          }
          note = null;
        }
      });
    },
    startSyncer = async () => {
      try {
        let user = await db.user.get();
        if (user) {
          db.ev.subscribe('db:refresh', syncChanges);
        }
      } catch (e) {
        console.log(e);
      }
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
        if (user) {
          dispatch({type: Actions.USER, user: user});
          await startSyncer();
        }
      } catch (e) {
        error = e;
        console.log(e);
      }
      if (!user) {
        setLoginMessage(dispatch);
      }
      dispatch({type: Actions.ALL});
      setInit(true);
      backupData();

    
        setTimeout(() => {
          if (error) {
            ToastEvent.show(error.message);
          }
          SplashScreen.hide();
        }, 500);
    
    });
  }, []);

  async function backupData() {
    await sleep(1000);
    settings = await MMKV.getStringAsync('settings');
    settings = JSON.parse(settings);
    if (await Backup.checkBackupRequired(settings.reminder)) {
      try {
        await Backup.run();
      } catch (e) {
        console.log(e);
      }
    }
  }

  async function Initialize() {
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
    settings = await MMKV.getStringAsync('settings');
    console.log('settings', settings);
    if (!settings) {
      settings = defaultState.settings;
      await MMKV.setStringAsync('settings', JSON.stringify(settings));
    } else {
      settings = JSON.parse(settings);
    }
    if (settings.fontScale) {
      scale.fontScale = settings.fontScale;
    }
    dispatch({type: Actions.SETTINGS, settings: {...settings}});
    updateSize();
    
    await updateTheme();
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
