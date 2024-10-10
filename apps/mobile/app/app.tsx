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
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import {
  THEME_COMPATIBILITY_VERSION,
  useThemeEngineStore
} from "@notesnook/theme";
import React, { useEffect } from "react";
import { I18nManager, View } from "react-native";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppLockedOverlay from "./components/app-lock-overlay";
import { withErrorBoundry } from "./components/exception-handler";
import GlobalSafeAreaProvider from "./components/globalsafearea";
import { useAppEvents } from "./hooks/use-app-events";
import { ApplicationHolder } from "./navigation";
import { themeTrpcClient } from "./screens/settings/theme-selector";
import Notifications from "./services/notifications";
import SettingsService from "./services/settings";
import { TipManager } from "./services/tip-manager";
import { useThemeStore } from "./stores/use-theme-store";
import { useUserStore } from "./stores/use-user-store";

I18nManager.allowRTL(false);
I18nManager.forceRTL(false);
I18nManager.swapLeftAndRightInRTL(false);
const { appLockEnabled, appLockMode } = SettingsService.get();
if (appLockEnabled || appLockMode !== "none") {
  useUserStore.getState().lockApp(true);
}

const App = () => {
  useAppEvents();
  //@ts-ignore
  globalThis["IS_MAIN_APP_RUNNING"] = true;
  useEffect(() => {
    SettingsService.onFirstLaunch();
    setTimeout(async () => {
      await Notifications.get();
      if (SettingsService.get().notifNotes) {
        Notifications.pinQuickNote(true);
      }
      TipManager.init();
    }, 100);
  }, []);
  return (
    <View
      style={{
        height: "100%",
        width: "100%",
        justifyContent: "center",
        alignItems: "center"
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

    return (
      <I18nProvider i18n={i18n}>
        <Element />
      </I18nProvider>
    );
  };
};

export default withTheme(withErrorBoundry(App, "App"));
