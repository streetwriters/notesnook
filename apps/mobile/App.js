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
} from 'react-native';
import {COLOR_SCHEME, SIZE, opacity, WEIGHT, pv, ph} from './src/common/common';
import Icon from 'react-native-vector-icons/Ionicons';
import ActionButton from 'react-native-action-button';
import Storage from 'notes-core/api/database';
import StorageInterface from './src/utils/storage';
import * as Animatable from 'react-native-animatable';
import {h} from './src/utils/utils';
import {Toast} from './src/components/Toast';
import {Menu} from './src/components/Menu';

const App = () => {
  const [colors, setColors] = useState(COLOR_SCHEME);
  const [fab, setFab] = useState(true);
  const [sidebar, setSidebar] = useState('30%');

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

    return () => {
      DeviceEventEmitter.removeListener('openSidebar', () => {
        setSidebar('30%');
      });
      DeviceEventEmitter.removeListener('closeSidebar', () => {
        setSidebar('0%');
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

  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        flexDirection: 'row',
      }}>
      {Platform.isPad ? (
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
      ) : (
        undefined
      )}

      <AppContainer
        style={{
          width: Platform.isPad ? '70%' : '100%',
          height: '100%',
        }}
        ref={navigatorRef => {
          NavigationService.setTopLevelNavigator(navigatorRef);
        }}
      />

      <Toast />

      {fab ? (
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
      )}
    </View>
  );
};

export default App;

export const storage = new Storage(StorageInterface);
