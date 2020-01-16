import React, {useState, useEffect} from 'react';
import NavigationService, {
  AppContainer,
} from './src/services/NavigationService';
import {StatusBar, View, DeviceEventEmitter, Platform} from 'react-native';
import * as Animatable from 'react-native-animatable';
import {h, w} from './src/utils/utils';
import {Toast} from './src/components/Toast';
import {Menu} from './src/components/Menu';
import SideMenu from './src/components/SideMenu';
import Storage from 'notes-core/api/database';
import StorageInterface from './src/utils/storage';
import {Provider, useTracked} from './src/provider';
import {DeviceDetectionService} from './src/utils/deviceDetection';
import {DialogManager} from './src/components/DialogManager';

export const DDS = new DeviceDetectionService();
export const db = new Storage(StorageInterface);

let sideMenuRef;
const App = () => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  // Global State

  // Local State
  const [sidebar, setSidebar] = useState(w * 0.3);
  const [init, setInit] = useState(false);
  // Variables

  // Effects

  useEffect(() => {
    DeviceEventEmitter.addListener('openSidebar', () => {
      DDS.isTab ? setSidebar(w * 0.3) : sideMenuRef.openMenu(true);
    });

    DeviceEventEmitter.addListener('closeSidebar', () => {
      DDS.isTab ? setSidebar(0) : sideMenuRef.openMenu(false);
    });
    DeviceEventEmitter.addListener('disableGesture', () => {
      sideMenuRef.setGestureEnabled(false);
    });
    DeviceEventEmitter.addListener('enableGesture', () => {
      sideMenuRef.setGestureEnabled(true);
    });

    return () => {
      DeviceEventEmitter.removeListener('openSidebar', () => {
        DDS.isTab ? setSidebar(0) : sideMenuRef.openMenu(true);
      });
      DeviceEventEmitter.removeListener('closeSidebar', () => {
        DDS.isTab ? setSidebar(0) : sideMenuRef.openMenu(false);
      });
      DeviceEventEmitter.removeListener('disableGesture', () => {
        sideMenuRef.setGestureEnabled(false);
      });
      DeviceEventEmitter.removeListener('enableGesture', () => {
        sideMenuRef.setGestureEnabled(true);
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
    db.init().then(() => {
      setInit(true);
    });
  }, []);

  // Render

  if (!init) {
    return <></>;
  }
  return (
    <Provider>
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
        <DialogManager
          colors={colors}
          update={type => {
            dispatch({type: type});
          }}
        />
      </View>
    </Provider>
  );
};

export default App;
