import 'react-native-gesture-handler';
import React from 'react';
import {AppRegistry} from 'react-native';
import {name as appName} from './app.json';
import {enableScreens} from 'react-native-screens';
import Notifications from './src/services/Notifications';
import jsdom from 'jsdom-jscore-rn';
global.HTMLParser = jsdom.html();
global.Buffer = require('buffer').Buffer;
enableScreens(true);

let Provider;
let App;
let NotesnookShare;
Notifications.init()
let QuickNoteIOS;

const AppProvider = () => {
  Provider = require('./src/provider').Provider;
  App = require('./App').default;
  return (
    <Provider>
        <App />
    </Provider>
  );
};

AppRegistry.registerComponent(appName, () => AppProvider);

AppRegistry.registerComponent('NotesnookShare', () => {
  NotesnookShare = require('./share/index').default;
  return NotesnookShare;
})

AppRegistry.registerComponent('QuickNoteIOS', () => {
  QuickNoteIOS = require("./QuickNoteIOS").default
  return QuickNoteIOS;
})

