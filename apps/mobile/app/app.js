import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { withErrorBoundry } from "./components/exception-handler";
import Launcher from "./components/launcher";
import { ApplicationHolder } from "./navigation";
import Notifications from "./services/notifications";
import SettingsService from "./services/settings";
import { TipManager } from "./services/tip-manager";
import { useUserStore } from "./stores/use-user-store";
import { useAppEvents } from "./hooks/use-app-events";

SettingsService.init();
SettingsService.checkOrientation();
const App = () => {
  useAppEvents();
  useEffect(() => {
    let { appLockMode } = SettingsService.get();
    if (appLockMode && appLockMode !== "none") {
      useUserStore.getState().setVerifyUser(true);
    }
    setTimeout(() => {
      SettingsService.onFirstLaunch();
      Notifications.get();
      TipManager.init();
    }, 100);
  }, []);
  return (
    <GestureHandlerRootView
      style={{
        flex: 1
      }}
    >
      <SafeAreaProvider>
        <ApplicationHolder />
        <Launcher />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default withErrorBoundry(App, "App");
