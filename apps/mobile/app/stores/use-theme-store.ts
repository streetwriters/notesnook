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

import { Appearance } from "react-native";
import create, { State } from "zustand";
import { useThemeColors, ThemeType } from "@notesnook/theme";
import SettingsService from "../services/settings";
export interface ThemeStore extends State {
  colors: Partial<ReturnType<typeof useThemeColors>>;
  lightTheme: ThemeType;
  darkTheme: ThemeType;
  colorScheme: "dark" | "light";
  setColors: (colors: ReturnType<typeof useThemeColors>) => void;
  setDarkTheme: (theme: ThemeType) => void;
  setLightTheme: (theme: ThemeType) => void;
  setColorScheme: (colorScheme: "dark" | "light") => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  colors: SettingsService.get().lighTheme.scopes["base"],
  lightTheme: SettingsService.get().lighTheme,
  darkTheme: SettingsService.get().darkTheme,
  colorScheme: SettingsService.get().useSystemTheme
    ? (Appearance.getColorScheme() as "dark" | "light")
    : SettingsService.get().colorScheme,
  setColors: () => {
    // TODO
    //set({ colors });
  },
  setDarkTheme: (darkTheme: ThemeType) => {
    set({ darkTheme });
  },
  setLightTheme: (lightTheme: ThemeType) => {
    set({ lightTheme });
  },
  setColorScheme: (colorScheme: "dark" | "light") => {
    set({ colorScheme });
    if (!SettingsService.get().useSystemTheme) {
      SettingsService.set({
        colorScheme: colorScheme
      });
    }
  }
}));
