import React, {useState, useEffect} from 'react';
import NavigationService, {
  AppContainer,
} from './src/services/NavigationService';
import {StatusBar, View, SafeAreaView, TouchableOpacity} from 'react-native';
import {COLOR_SCHEME, SIZE, opacity, WEIGHT} from './src/common/common';
import Icon from 'react-native-vector-icons/Ionicons';
import ActionButton from 'react-native-action-button';

const App = () => {
  const [colors, setColors] = useState(COLOR_SCHEME);
  useEffect(() => {
    StatusBar.setBackgroundColor('transparent');
    StatusBar.setTranslucent(true);
    StatusBar.setBarStyle('dark-content');
  });
  return (
    <>
      <AppContainer
        ref={navigatorRef => {
          NavigationService.setTopLevelNavigator(navigatorRef);
        }}
      />

      <ActionButton elevation={5} buttonColor={colors.accent}>
        <ActionButton.Item
          buttonColor="#9b59b6"
          textStyle={{
            fontFamily: WEIGHT.regular,
            color: 'white',
          }}
          title=""
          hideShadow={true}
          onPress={() => console.log('notes tapped!')}>
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
        <ActionButton.Item
          textStyle={{
            fontFamily: WEIGHT.regular,
            color: 'white',
          }}
          hideShadow={true}
          buttonColor="#1abc9c"
          title=""
          onPress={() => {
            NavigationService.navigate('ReminderEditor');
          }}>
          <Icon
            name="ios-clock"
            style={{
              fontSize: 20,
              height: 22,
              color: 'white',
            }}
          />
        </ActionButton.Item>
      </ActionButton>
    </>
  );
};

export default App;
