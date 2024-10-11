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

import { ThemeDefinition } from "@notesnook/theme";
import { Appearance, StatusBar } from "react-native";
import create, { State } from "zustand";
import SettingsService from "../services/settings";
import switchTheme from "react-native-theme-switch-animation";

import changeNavigationBarColor from "react-native-navigation-bar-color";
export interface ThemeStore extends State {
  lightTheme: ThemeDefinition;
  darkTheme: ThemeDefinition;
  colorScheme: "dark" | "light";
  setDarkTheme: (theme: ThemeDefinition) => void;
  setLightTheme: (theme: ThemeDefinition) => void;
  setColorScheme: (colorScheme?: "dark" | "light") => void;
}

export function changeSystemBarColors() {
  const change = () => {
    let currTheme =
      useThemeStore.getState().colorScheme === "dark"
        ? SettingsService.getProperty("darkTheme")
        : SettingsService.getProperty("lighTheme");

    const isDark = useThemeStore.getState().colorScheme === "dark";
    changeNavigationBarColor(
      currTheme.scopes.base.primary.background,
      isDark,
      false
    );
    StatusBar.setBackgroundColor("transparent" as any);
    StatusBar.setTranslucent(true);
    StatusBar.setBarStyle(isDark ? "light-content" : "dark-content");
  };
  change();
  setTimeout(change, 400);
  setTimeout(change, 1000);
}

function switchThemeWithAnimation(fn: () => void) {
  switchTheme({
    switchThemeFunction: fn,
    animationConfig: {
      type: "circular",
      duration: 500,
      startingPoint: {
        cxRatio: 0,
        cyRatio: 0
      }
    }
  });
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  lightTheme: SettingsService.get().lighTheme,
  darkTheme: SettingsService.get().darkTheme,
  colorScheme: SettingsService.get().useSystemTheme
    ? (Appearance.getColorScheme() as "dark" | "light")
    : SettingsService.get().colorScheme,
  setDarkTheme: (darkTheme) => {
    switchThemeWithAnimation(() => {
      set({ darkTheme });
      changeSystemBarColors();
      SettingsService.setProperty("darkTheme", darkTheme);
    });
  },
  setLightTheme: (lightTheme) => {
    switchThemeWithAnimation(() => {
      set({ lightTheme });
      changeSystemBarColors();
      SettingsService.setProperty("lighTheme", lightTheme);
    });
  },
  setColorScheme: (colorScheme) => {
    switchThemeWithAnimation(() => {
      const nextColorScheme =
        colorScheme === undefined
          ? get().colorScheme === "dark"
            ? "light"
            : "dark"
          : colorScheme;
      set({
        colorScheme: nextColorScheme
      });
      changeSystemBarColors();
      if (!SettingsService.getProperty("useSystemTheme")) {
        SettingsService.set({
          colorScheme: nextColorScheme
        });
      }
    });
  }
}));
