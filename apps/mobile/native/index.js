/* eslint-disable @typescript-eslint/no-var-requires */
import NetInfo from "@react-native-community/netinfo";
import React from 'react';
import { AppRegistry, LogBox, Platform, UIManager } from 'react-native';
import Config from 'react-native-config';
import 'react-native-get-random-values';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableFreeze } from "react-native-screens";
import { BackgroundSync } from '../app/services/background-sync';
import Notifications from "../app/services/notifications";
import appJson from './app.json';
import './globals.js';

BackgroundSync.registerHeadlessTask();
BackgroundSync.start();
Notifications.init();

enableFreeze(true);
NetInfo.configure({
  reachabilityUrl: "https://notesnook.com",
  reachabilityTest: (response) => {
    if (!response) return false;
    return response?.status >= 200 && response?.status < 300;
  }
});


const appName = appJson.name;
if (Config.isTesting) {
  Date.prototype.toLocaleString = () => 'XX-XX-XX';
}
UIManager.setLayoutAnimationEnabledExperimental &&
  UIManager.setLayoutAnimationEnabledExperimental(true);

if (__DEV__) {
  console.warn = () => null;
  LogBox.ignoreAllLogs();
}

const AppProvider = () => {
  const App = require('../app/app').default;
  return <App />;
};

AppRegistry.registerComponent(appName, () => AppProvider);

const NotePreviewConfigureProvider = () => {
  const App = require('../app/app').default;
  return <App configureMode="note-preview" />;
};

AppRegistry.registerComponent("NotePreviewConfigure", () => NotePreviewConfigureProvider);


const ShareProvider = () => {
  let NotesnookShare = require('../share/index').default;
  return Platform.OS === 'ios' ? (
    <SafeAreaProvider>
      <NotesnookShare quicknote={false} />
    </SafeAreaProvider>
  ) : (
    <NotesnookShare quicknote={false} />
  );
};

AppRegistry.registerComponent('NotesnookShare', () => ShareProvider);