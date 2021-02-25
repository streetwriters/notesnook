import React, {useEffect} from 'react';
import Orientation from 'react-native-orientation';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import SplashScreen from 'react-native-splash-screen';
import {AppRootEvents} from './AppRootEvents';
import {RootView} from './initializer.root';
import AppLoader from './src/components/AppLoader';
import {useTracked} from './src/provider';
import {Actions} from './src/provider/Actions';
import {DDS} from './src/services/DeviceDetection';
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
        await SettingsService.init();
        eSendEvent(eOpenSideMenu);
        SplashScreen.hide();
        await db.init();
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
