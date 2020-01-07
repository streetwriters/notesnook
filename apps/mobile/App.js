import React, {useState, useEffect} from 'react';
import NavigationService, {
  AppContainer,
} from './src/services/NavigationService';
import {
  StatusBar,
  View,
  DeviceEventEmitter,
  Platform,
  Animated,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import {h, w} from './src/utils/utils';
import {Toast} from './src/components/Toast';
import {Menu} from './src/components/Menu';
import SideMenu from 'react-native-side-menu';
import Storage from 'notes-core/api/database';
import StorageInterface from './src/utils/storage';
import {AppProvider} from './src/provider';
import {DeviceDetectionService} from './src/utils/deviceDetection';
import {useAppContext} from './src/provider/useAppContext';
import {
  COLOR_SCHEME,
  onThemeUpdate,
  clearThemeUpdateListener,
} from './src/common/common';

export const DDS = new DeviceDetectionService();
export const db = new Storage(StorageInterface);

const App = () => {
  // Global State
  const [colors, setColors] = useState(COLOR_SCHEME);

  // Local State
  const [sidebar, setSidebar] = useState(w * 0.3);
  const [isOpen, setOpen] = useState(false);
  const [disableGestures, setDisableGesture] = useState(false);
  const [isIntialized, setIsInitialized] = useState(false);

  // Effects
  useEffect(() => {
    db.init().then(() => {
      setIsInitialized(true);
    });
  }, []);

  useEffect(() => {
    DeviceEventEmitter.addListener('openSidebar', () => {
      DDS.isTab ? setSidebar(w * 0.3) : setOpen(true);
    });
    DeviceEventEmitter.addListener('closeSidebar', () => {
      DDS.isTab ? setSidebar(0) : setOpen(false);
    });
    DeviceEventEmitter.addListener('disableGesture', () => {
      setDisableGesture(true);
    });
    DeviceEventEmitter.addListener('enableGesture', () => {
      setDisableGesture(false);
    });

    return () => {
      DeviceEventEmitter.removeListener('openSidebar', () => {
        DDS.isTab ? setSidebar('30%') : setOpen(true);
      });
      DeviceEventEmitter.removeListener('closeSidebar', () => {
        DDS.isTab ? setSidebar('0%') : setOpen(false);
      });
      DeviceEventEmitter.removeListener('disableGesture', () => {
        setDisableGesture(true);
      });
      DeviceEventEmitter.removeListener('enableGesture', () => {
        setDisableGesture(false);
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
    onThemeUpdate(() => {
      setColors({...COLOR_SCHEME});
    });
    return () => {
      clearThemeUpdateListener(() => {
        setColors({...COLOR_SCHEME});
      });
    };
  }, []);

  // Render

  if (!isIntialized) {
    return <View />;
  }
  return (
    <AppProvider>
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
            isOpen={isOpen}
            disableGestures={disableGestures}
            bounceBackOnOverdraw={false}
            contentContainerStyle={{
              opacity: 0,
              backgroundColor: colors.bg,
            }}
            animationFunction={(prop, value) =>
              Animated.spring(prop, {
                toValue: value,
                friction: 8,
                useNativeDriver: true,
              })
            }
            onChange={args => {
              setTimeout(() => {
                setOpen(args);
              }, 300);
            }}
            menu={
              <Menu hide={false} colors={colors} close={() => setOpen(false)} />
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
      </View>
    </AppProvider>
  );
};

export default App;
