/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import React from 'react';
import {Provider} from './src/provider';
import {scale} from './src/common/common';

const AppProvider = () => {
  return (
    <Provider>
      <App />
    </Provider>
  );
};

AppRegistry.registerComponent(appName, () => AppProvider);
