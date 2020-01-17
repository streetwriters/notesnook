import React, {useState, useEffect} from 'react';
import NavigationService, {
  AppContainer,
} from './src/services/NavigationService';
import {StatusBar, View, Platform} from 'react-native';
import * as Animatable from 'react-native-animatable';
import {h, w} from './src/utils/utils';
import {Toast} from './src/components/Toast';
import {Menu} from './src/components/Menu';
import SideMenu from './src/components/SideMenu';
import Storage from 'notes-core/api/database';
import StorageInterface from './src/utils/storage';
<<<<<<< HEAD
import {useTracked, ACTIONS} from './src/provider';
import {DeviceDetectionService} from './src/utils/deviceDetection';
import {
  DialogManager,
  _recieveEvent,
  _unSubscribeEvent,
} from './src/components/DialogManager';
import {getColorScheme} from './src/common/common';
=======
import {DeviceDetectionService} from './src/utils/deviceDetection';
import {DialogManager} from './src/components/DialogManager';
import {useAppContext} from './src/provider/useAppContext';
import {AppProvider} from './src/provider';
import {COLOR_SCHEME_LIGHT} from './src/common/common';
>>>>>>> cfee96fb230bdd33c710a5e72a80ccf2b82a8646

export const DDS = new DeviceDetectionService();
export const db = new Storage(StorageInterface);

let sideMenuRef;
const App = () => {
<<<<<<< HEAD
  const [state, dispatch] = useTracked();
  const {colors} = state;
=======
  const [colors, setColors] = useState(COLOR_SCHEME_LIGHT);
  // Global State
>>>>>>> cfee96fb230bdd33c710a5e72a80ccf2b82a8646

  // Local State
  const [sidebar, setSidebar] = useState(w * 0.3);
  const [init, setInit] = useState(false);

  // Effects

  const openSidebar = () => {
    DDS.isTab ? setSidebar(w * 0.3) : sideMenuRef.openMenu(true);
  };
  const closeSidebar = () => {
    DDS.isTab ? setSidebar(0) : sideMenuRef.openMenu(false);
  };

  const disableGestures = () => {
    sideMenuRef.setGestureEnabled(false);
  };

  const enableGestures = () => {
    sideMenuRef.setGestureEnabled(true);
  };

  useEffect(() => {
    _recieveEvent('openSidebar', openSidebar);
    _recieveEvent('closeSidebar', closeSidebar);

    _recieveEvent('disableGesture', disableGestures);
    _recieveEvent('enableGesture', enableGestures);

    return () => {
      _unSubscribeEvent('openSidebar', openSidebar);
      _unSubscribeEvent('closeSidebar', closeSidebar);

      _unSubscribeEvent('disableGesture', disableGestures);
      _unSubscribeEvent('enableGesture', enableGestures);
    };
  }, []);

  useEffect(() => {
    _recieveEvent('updateEvent', type => {
      dispatch(type);
    });
    return () => {
      _unSubscribeEvent('updateEvent', type => {
        dispatch(type);
      });
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
      StatusBar.setBarStyle(colors.night ? 'light-content' : 'dark-content');
    }
  }, []);

  useEffect(() => {
    updateAppTheme().then(() => {
      db.init().then(() => {
        setInit(true);
      });
    });
  });

  async function updateAppTheme(colors = state.colors) {
    let newColors = await getColorScheme(colors);
    dispatch({type: ACTIONS.THEME, colors: newColors});
  }

  // Render
  if (!init) {
    return <></>;
  }

  return (
<<<<<<< HEAD
    <>
=======
    <AppProvider>
>>>>>>> cfee96fb230bdd33c710a5e72a80ccf2b82a8646
      <View
        style={{
          width: '100%',
          height: '100%',
          flexDirection: 'row',
          backgroundColor: colors.bg,
        }}>
        {DDS.isTab ? (
          <>
            <Animatable.View
              transition="width"
              duration={200}
              style={{
                width: sidebar,
              }}>
              <Menu
                hide={false}
                colors={colors}
                close={() => {
                  //setSidebar('0%');
                }}
              />
            </Animatable.View>
            <AppContainer
              style={{
                width: DDS.isTab ? '70%' : '100%',
                height: '100%',
              }}
              ref={navigatorRef => {
                NavigationService.setTopLevelNavigator(navigatorRef);
              }}
            />
          </>
        ) : (
          <SideMenu
            ref={ref => (sideMenuRef = ref)}
            bounceBackOnOverdraw={false}
            contentContainerStyle={{
              opacity: 0,
              backgroundColor: colors.bg,
            }}
            menu={
              <Menu
                hide={false}
                colors={colors}
                close={() => sideMenuRef.openMenu(!sideMenuRef.isOpen)}
              />
            }
            openMenuOffset={w / 1.3}>
            <AppContainer
              style={{
                width: DDS.isTab ? '70%' : '100%',
                height: '100%',
                backgroundColor: colors.bg,
              }}
              ref={navigatorRef => {
                NavigationService.setTopLevelNavigator(navigatorRef);
              }}
            />
          </SideMenu>
        )}
        <Toast />
<<<<<<< HEAD
        <DialogManager colors={colors} />
      </View>
    </>
=======
      </View>
      <DialogManager colors={colors} />
    </AppProvider>
>>>>>>> cfee96fb230bdd33c710a5e72a80ccf2b82a8646
  );
};

export default App;
