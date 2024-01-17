/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

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
import "@azure/core-asynciterator-polyfill";
import "react-native-gesture-handler";
import SettingsService from "./services/settings";
import {
  THEME_COMPATIBILITY_VERSION,
  useThemeEngineStore
} from "@notesnook/theme";
import React, { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppLockedOverlay from "./components/app-lock-overlay";
import { withErrorBoundry } from "./components/exception-handler";
import GlobalSafeAreaProvider from "./components/globalsafearea";
import { useAppEvents } from "./hooks/use-app-events";
import { ApplicationHolder } from "./navigation";
import Notifications from "./services/notifications";
import { TipManager } from "./services/tip-manager";
import { useThemeStore } from "./stores/use-theme-store";
import { useUserStore } from "./stores/use-user-store";
import { themeTrpcClient } from "./screens/settings/theme-selector";

// How app lock works
// 1. User goes to settings and setup app lock with a Pin/Password.
// 2. The Pin/Password is used to encrypt a random value or user's encryption key.
// 3. The encrypted value is stored in MMKV
// 4. When the app launches, the same value is decrypted with user provided key, if it works, we launch the app otherwise it remains locked.
// 5. If Biometrics are enabled, the app lock pin/password is stored in keychain. the value can be accessed if fingerprint auth works ONLY.
// 6. User can  manually enter the pin if biometrics fails.
// 7. There is no way to enter the app if user forgets the PIN. The only way is to reset app data and start fresh again.

// How to handle app lock for existing users...
// 1.

const App = () => {
  const init = useAppEvents();
  useEffect(() => {
    const { appLockEnabled, appLockMode } = SettingsService.get();
    if (appLockEnabled || appLockMode !== "none") {
      useUserStore.getState().lockApp(true);
    }

    //@ts-ignore
    globalThis["IS_MAIN_APP_RUNNING"] = true;
    init();
    setTimeout(async () => {
      SettingsService.onFirstLaunch();
      await Notifications.get();
      if (SettingsService.get().notifNotes) {
        Notifications.pinQuickNote(true);
      }
      TipManager.init();
    }, 100);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View
      style={{
        height: "100%",
        width: "100%"
      }}
    >
      <View
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          zIndex: -1
        }}
        pointerEvents="none"
      >
        <SafeAreaProvider>
          <GlobalSafeAreaProvider />
        </SafeAreaProvider>
      </View>

      <GestureHandlerRootView
        style={{
          height: "100%",
          width: "100%"
        }}
      >
        <ApplicationHolder />
      </GestureHandlerRootView>
      <AppLockedOverlay />
    </View>
  );
};

let currTheme =
  useThemeStore.getState().colorScheme === "dark"
    ? SettingsService.getProperty("darkTheme")
    : SettingsService.getProperty("lighTheme");
useThemeEngineStore.getState().setTheme(currTheme);

export const withTheme = (Element: () => JSX.Element) => {
  return function AppWithThemeProvider() {
    const [colorScheme, darkTheme, lightTheme] = useThemeStore((state) => [
      state.colorScheme,
      state.darkTheme,
      state.lightTheme
    ]);

    useEffect(() => {
      setTimeout(() => {
        const currentTheme = colorScheme === "dark" ? darkTheme : lightTheme;
        if (!currentTheme) return;
        themeTrpcClient.updateTheme
          .query({
            version: currentTheme.version,
            compatibilityVersion: THEME_COMPATIBILITY_VERSION,
            id: currentTheme.id
          })
          .then((theme) => {
            if (theme) {
              console.log(theme.version, "theme updated");
              theme.colorScheme === "dark"
                ? useThemeStore.getState().setDarkTheme(theme)
                : useThemeStore.getState().setLightTheme(theme);
            }
          })
          .catch(console.log);
      }, 1000);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const nextTheme = colorScheme === "dark" ? darkTheme : lightTheme;
    if (JSON.stringify(nextTheme) !== JSON.stringify(currTheme)) {
      useThemeEngineStore
        .getState()
        .setTheme(colorScheme === "dark" ? darkTheme : lightTheme);
      currTheme = nextTheme;
    }

    return <Element />;
  };
};

export default withTheme(withErrorBoundry(App, "App"));
