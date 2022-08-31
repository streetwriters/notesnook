/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

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
