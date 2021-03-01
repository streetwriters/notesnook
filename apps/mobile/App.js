import React, {useEffect} from 'react';
import {BackHandler} from 'react-native';
import Orientation from 'react-native-orientation';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import SplashScreen from 'react-native-splash-screen';
import {AppRootEvents} from './AppRootEvents';
import {RootView} from './initializer.root';
import AppLoader from './src/components/AppLoader';
import {useTracked} from './src/provider';
import {Actions} from './src/provider/Actions';
import BiometricService from './src/services/BiometricService';
import {DDS} from './src/services/DeviceDetection';
import RNExitApp from 'react-native-exit-app';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from './src/services/EventManager';
import SettingsService from './src/services/SettingsService';
import {db} from './src/utils/DB';
import {eDispatchAction, eOpenSideMenu} from './src/utils/Events';
import EditorRoot from './src/views/Editor/EditorRoot';

let initStatus = false;
const App = () => {
  const [, dispatch] = useTracked();

  useEffect(() => {
    (async () => {
      try {
        Orientation.getOrientation((e, r) => {
          DDS.checkSmallTab(r);
          dispatch({
            type: Actions.DEVICE_MODE,
            state: DDS.isLargeTablet()
              ? 'tablet'
              : DDS.isSmallTab
              ? 'smallTablet'
              : 'mobile',
          });
        });

        let func = async () => {
          eSendEvent(eOpenSideMenu);
          SplashScreen.hide();
          await db.init();
        };

        await SettingsService.init();
        if (SettingsService.get().appLockMode !== 'none') {
          let result = await BiometricService.validateUser(
            'Unlock to access your notes',
            '',
          );
          if (result) {
            await func();
          } else {
            RNExitApp.exitApp();
            return;
          }
        } else {
          await func();
        }
      } catch (e) {
      } finally {
        initStatus = true;
        loadMainApp();
      }
    })();
  }, []);

  const _dispatch = (data) => {
    dispatch(data);
  };

  useEffect(() => {
    eSubscribeEvent(eDispatchAction, _dispatch);
    return () => {
      eUnSubscribeEvent(eDispatchAction, _dispatch);
    };
  }, []);

  const loadMainApp = () => {
    if (initStatus) {
      SettingsService.setAppLoaded();
      eSendEvent('load_overlay');
      dispatch({type: Actions.ALL});
    }
  };

  return (
    <SafeAreaProvider>
      <RootView />
      <EditorRoot />
      <AppRootEvents />
      <AppLoader onLoad={loadMainApp} />
    </SafeAreaProvider>
  );
};

export default App;
