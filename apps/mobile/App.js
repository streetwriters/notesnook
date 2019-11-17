import React, {useState, useEffect} from 'react';
import NavigationService, {
  AppContainer,
} from './src/services/NavigationService';
import {StatusBar} from 'react-native';

const App = () => {
  useEffect(() => {
    StatusBar.setBackgroundColor('transparent');
    StatusBar.setTranslucent(true);
    StatusBar.setBarStyle('dark-content');
  });
  return (
    <AppContainer
      ref={navigatorRef => {
        NavigationService.setTopLevelNavigator(navigatorRef);
      }}
    />
  );
};

export default App;
