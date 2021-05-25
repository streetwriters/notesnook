import 'react-native-gesture-handler';
import React from 'react';
import {AppRegistry} from 'react-native';
import {name as appName} from './app.json';
import { enableScreens } from 'react-native-screens';
global.Buffer = require('buffer').Buffer;
enableScreens(true);
let Provider;
let App;
let NotesnookShare;

const AppProvider = () => {
  Provider = require('./src/provider').Provider
  App = require("./App").default
  return (
    <Provider>
      <App />
    </Provider>
  );
};

AppRegistry.registerComponent(appName, () => AppProvider);
AppRegistry.registerComponent('NotesnookShare', () => {
  NotesnookShare = require("./NotesnookShare").default
  return NotesnookShare;
})
