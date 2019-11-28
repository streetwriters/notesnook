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
} from 'react-native';
import {COLOR_SCHEME, SIZE, opacity, WEIGHT} from './src/common/common';
import Icon from 'react-native-vector-icons/Ionicons';
import ActionButton from 'react-native-action-button';
import Storage from 'notes-core/api/database';
import StorageInterface from './src/utils/storage';
const App = () => {
  const [colors, setColors] = useState(COLOR_SCHEME);
  const [fab, setFab] = useState(true);

  useEffect(() => {
    DeviceEventEmitter.addListener('hide', () => {
      setFab(false);
    });
    DeviceEventEmitter.addListener('show', () => {
      setFab(true);
    });
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
      StatusBar.setBarStyle('dark-content');
    }
    return () => {
      DeviceEventEmitter.removeListener('hide', () => {
        setFab(false);
      });
      DeviceEventEmitter.removeListener('show', () => {
        setFab(true);
      });
    };
  });
  return (
    <>
      <AppContainer
        ref={navigatorRef => {
          NavigationService.setTopLevelNavigator(navigatorRef);
        }}
      />

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
            onPress={() => NavigationService.navigate('Editor')}>
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
    </>
  );
};

export default App;

export const storage = new Storage(StorageInterface);
