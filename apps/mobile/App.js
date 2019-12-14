import React, {useState, useEffect} from 'react';
import NavigationService, {
  AppContainer,
} from './src/services/NavigationService';
import {
  StatusBar,
  View,
  DeviceEventEmitter,
  Platform,
  Keyboard,
  Animated,
} from 'react-native';
import {
  COLOR_SCHEME,
  onThemeUpdate,
  clearThemeUpdateListener,
  getColorScheme,
} from './src/common/common';
import Icon from 'react-native-vector-icons/Ionicons';
import ActionButton from 'react-native-action-button';
import * as Animatable from 'react-native-animatable';
import {h, w} from './src/utils/utils';
import {Toast} from './src/components/Toast';
import {Menu} from './src/components/Menu';
import SideMenu from 'react-native-side-menu';
import Storage from 'notes-core/api/database';
import StorageInterface from './src/utils/storage';
import {AppProvider} from './src/provider';
import {DeviceDetectionService} from './src/utils/deviceDetection';
export const DDS = new DeviceDetectionService();

export const db = new Storage(StorageInterface);

const App = () => {
  const [colors, setColors] = useState(COLOR_SCHEME);
  const [fab, setFab] = useState(true);
  const [sidebar, setSidebar] = useState(w * 0.3);
  const [isOpen, setOpen] = useState(false);
  const [disableGestures, setDisableGesture] = useState(false);
  const [buttonHide, setButtonHide] = useState(false);
  const [isIntialized, setIsInitialized] = useState(false);

  useEffect(() => {
    getColorScheme(colors);
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
    DeviceEventEmitter.addListener('hide', () => {
      setFab(false);
    });
    DeviceEventEmitter.addListener('show', () => {
      setFab(true);
    });

    return () => {
      DeviceEventEmitter.removeListener('hide', () => {
        setFab(false);
      });
      DeviceEventEmitter.removeListener('show', () => {
        setFab(true);
      });
    };
  }, []);

  useEffect(() => {
    Keyboard.addListener('keyboardDidShow', () => {
      setDisableGesture(true);
      setButtonHide(true);
    });
    Keyboard.addListener('keyboardDidHide', () => {
      setDisableGesture(false);
      setTimeout(() => {
        setButtonHide(false);
      }, 500);
    });
    return () => {
      Keyboard.removeListener('keyboardDidShow', () => {
        setDisableGesture(true);
        setButtonHide(true);
      });
      Keyboard.removeListener('keyboardDidHide', () => {
        setDisableGesture(false);
        setTimeout(() => {
          setButtonHide(false);
        }, 500);
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
      StatusBar.setBarStyle(colors.night ? 'light-content' : 'dark-content');
    });
    return () => {
      clearThemeUpdateListener(() => {
        StatusBar.setBarStyle(colors.night ? 'light-content' : 'dark-content');
      });
    };
  }, []);

  useEffect(() => {
    db.init().then(() => {
      setIsInitialized(true);
    });
  }, []);

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
                hide={buttonHide}
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
              <Menu
                hide={buttonHide}
                colors={colors}
                close={() => setOpen(false)}
              />
            }
            openMenuOffset={w / 1.3}>
            <AppContainer
              style={{
                width: DDS.isTab ? '70%' : '100%',
                height: '100%',
              }}
              ref={navigatorRef => {
                NavigationService.setTopLevelNavigator(navigatorRef);
              }}
            />
          </SideMenu>
        )}

        {/* {fab ? (
        <ActionButton elevation={5} buttonColor={colors.accent}>
          <ActionButton.Item
            buttonColor="#9b59b6"
            textStyle={{
              fontFamily: WEIGHT.regular,
              color: 'white',
            }}
            title=""
            hideShadow={true}
            onPress={() => {
              NavigationService.navigate('Editor');
            }}>
            <Icon
              name="md-create"
              style={{
                fontSize: 20,
                height: 22,
                color: 'white',
              }}
            />
          </ActionButton.Item>
          <ActionButton.Item
            textStyle={{
              fontFamily: WEIGHT.regular,
              color: 'white',
            }}
            hideShadow={true}
            buttonColor="#3498db"
            title=""
            onPress={() => {
              NavigationService.navigate('ListsEditor');
            }}>
            <Icon
              name="ios-list"
              style={{
                fontSize: 20,
                height: 22,
                color: 'white',
              }}
            />
          </ActionButton.Item>
        </ActionButton>
      ) : (
        undefined
      )} */}

        <Toast />
      </View>
    </AppProvider>
  );
};

export default App;
