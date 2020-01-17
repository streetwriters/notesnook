/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App, {db} from './App';
import {name as appName} from './app.json';
import React, {useEffect} from 'react';
import {Provider} from './src/provider';

const AppProvider = () => {
  return (
    <Provider>
      <App />
    </Provider>
  );
};

AppRegistry.registerComponent(appName, () => AppProvider);
