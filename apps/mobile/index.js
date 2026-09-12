/* eslint-disable @typescript-eslint/no-var-requires */
import NetInfo from "@react-native-community/netinfo";
import React from "react";
import { AppRegistry, LogBox } from "react-native";
import Config from "react-native-config";
import "react-native-get-random-values";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { enableFreeze } from "react-native-screens";
import { BackgroundSync } from "./app/services/background-sync";
import { PebbleIndexCapture } from "./app/services/pebble-index-capture";
import Notifications from "./app/services/notifications";
import appJson from "./app.json";
import "./globals.js";

BackgroundSync.start();
try {
  BackgroundSync.registerHeadlessTask();
} catch (e) {
  console.warn("BOOT_TASK register failed", e);
}
try {
  PebbleIndexCapture.registerHeadlessTask();
  PebbleIndexCapture.syncNativePrefs();
} catch (e) {
  console.warn("PEBBLE INDEX register failed", e);
}
Notifications.init();

enableFreeze(true);
NetInfo.configure({
  reachabilityUrl: "https://api.notesnook.com/health",
  reachabilityTest: (response) => {
    if (!response) return false;
    console.log("reachabilty test", response.status);
    return response?.status >= 200 && response?.status < 300;
  }
});

const appName = appJson.name;
if (Config.isTesting) {
  Date.prototype.toLocaleString = () => "XX-XX-XX";
}

if (__DEV__) {
  console.warn = () => null;
  LogBox.ignoreAllLogs();
}

const AppProvider = () => {
  const App = require("./app/app").default;
  return <App />;
};

AppRegistry.registerComponent(appName, () => AppProvider);

const NotePreviewConfigureProvider = () => {
  const App = require("./app/app").default;
  return <App configureMode="note-preview" />;
};

AppRegistry.registerComponent(
  "NotePreviewConfigure",
  () => NotePreviewConfigureProvider
);

const ShareProvider = () => {
  let NotesnookShare = require("./app/share/index").default;
  return (
    <SafeAreaProvider>
      <NotesnookShare />
    </SafeAreaProvider>
  );
};

AppRegistry.registerComponent("NotesnookShare", () => ShareProvider);
