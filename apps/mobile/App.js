import React, {useEffect} from 'react';
import Orientation from 'react-native-orientation';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import SplashScreen from 'react-native-splash-screen';
import {AppRootEvents} from './AppRootEvents';
import {RootView} from './initializer.root';
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

const App = () => {
  const [, dispatch] = useTracked();

  useEffect(() => {
    (async () => {
      try {
        await SettingsService.init();
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
          SplashScreen.hide();
        });
      
        await db.init();
      } catch (e) {
        console.log(e);
      } finally {
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
   
    dispatch({type: Actions.ALL});
    eSendEvent(eOpenSideMenu);

    SettingsService.setAppLoaded();
    db.notes.init().then(() => {
      dispatch({type: Actions.NOTES});
      dispatch({type: Actions.FAVORITES});
      dispatch({type: Actions.LOADING, loading: false});
    });
  };

  return (
    <SafeAreaProvider>
      <RootView />
      <EditorRoot />
      <AppRootEvents />
    </SafeAreaProvider>
  );
};

export default App;
