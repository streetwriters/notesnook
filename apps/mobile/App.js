import React, {useEffect} from 'react';
import Orientation from 'react-native-orientation';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import SplashScreen from 'react-native-splash-screen';
import {AppRootEvents} from './AppRootEvents';
import {RootView} from './initializer.root';
import {useTracked} from './src/provider';
import {Actions} from './src/provider/Actions';
import {DDS} from './src/services/DeviceDetection';
import {eSendEvent, eSubscribeEvent, eUnSubscribeEvent} from './src/services/EventManager';
import SettingsService from './src/services/SettingsService';
import {db} from './src/utils/DB';
import {eDispatchAction, eOpenSideMenu, refreshNotesPage} from './src/utils/Events';
import EditorRoot from './src/views/Editor/EditorRoot';

const App = () => {
  const [, dispatch] = useTracked();

  useEffect(() => {
    SettingsService.init().then((r) => {
      DDS.checkSmallTab(Orientation.getInitialOrientation());
      dispatch({
        type: Actions.DEVICE_MODE,
        state: DDS.isLargeTablet()
          ? 'tablet'
          : DDS.isSmallTab
          ? 'smallTablet'
          : 'mobile',
      });
      db.init().catch(console.log).finally(loadMainApp);
    });
  }, []);

  useEffect(() => {
    eSubscribeEvent(eDispatchAction, (type) => {
      dispatch(type);
    });
    return () => {
      eUnSubscribeEvent(eDispatchAction, (type) => {
        dispatch(type);
      });
    };
  }, []);

  const loadMainApp = () => {
    SplashScreen.hide();
    db.notes.init().then(() => {
      dispatch({type: Actions.NOTES});
      dispatch({type: Actions.FAVORITES});
      eSendEvent(refreshNotesPage);
      dispatch({type: Actions.LOADING, loading: false});
      SettingsService.setAppLoaded();
    });
    eSendEvent(eOpenSideMenu);

    dispatch({type: Actions.ALL});
 
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
