import React, {useState, useEffect} from 'react';
import NavigationService, {
  AppContainer,
} from './src/services/NavigationService';
import {
  StatusBar,
  View,
  SafeAreaView,
  TouchableOpacity,
  DeviceEventEmitter,
  Platform,
  Text,
  Keyboard,
} from 'react-native';
import {COLOR_SCHEME, SIZE, opacity, WEIGHT, pv, ph} from './src/common/common';
import Icon from 'react-native-vector-icons/Ionicons';
import ActionButton from 'react-native-action-button';
import Storage from 'notes-core/api/database';
import StorageInterface from './src/utils/storage';
import * as Animatable from 'react-native-animatable';
import {h, w} from './src/utils/utils';
import {Toast} from './src/components/Toast';
import {Menu} from './src/components/Menu';
import SideMenu from 'react-native-side-menu';
const App = () => {
  const [colors, setColors] = useState(COLOR_SCHEME);
  const [fab, setFab] = useState(true);
  const [sidebar, setSidebar] = useState('30%');
  const [isOpen, setOpen] = useState(false);
  const [disableGestures, setDisableGesture] = useState(false);
  const [buttonHide, setButtonHide] = useState(false);
  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
      StatusBar.setBarStyle('dark-content');
    }
  }, []);

  useEffect(() => {
    DeviceEventEmitter.addListener('openSidebar', () => {
      setSidebar('30%');
    });
    DeviceEventEmitter.addListener('closeSidebar', () => {
      setSidebar('0%');
    });
    DeviceEventEmitter.addListener('disableGesture', () => {
      setDisableGesture(true);
    });
    DeviceEventEmitter.addListener('enableGesture', () => {
      setDisableGesture(false);
    });

    return () => {
      DeviceEventEmitter.removeListener('openSidebar', () => {
        setSidebar('30%');
      });
      DeviceEventEmitter.removeListener('closeSidebar', () => {
        setSidebar('0%');
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

  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        flexDirection: 'row',
      }}>
      {Platform.isPad ? (
        <>
          <Animatable.View
            transition="width"
            duration={200}
            style={{
              width: sidebar,
            }}>
            <Menu
              colors={colors}
              close={() => {
                setSidebar('0%');
              }}
            />{' '}
            : undefined
          </Animatable.View>
          <AppContainer
            style={{
              width: Platform.isPad ? '70%' : '100%',
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
          onChange={args => {
            setOpen(args);
          }}
          menu={
            <Menu
              hide={buttonHide}
              colors={colors}
              close={() => setOpen(false)}
            />
          }
          openMenuOffset={w / 1.5}>
          <AppContainer
            style={{
              width: Platform.isPad ? '70%' : '100%',
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
  );
};

export default App;

export const storage = new Storage(StorageInterface);
