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

import createStore from "../common/store";
import BaseStore from "./index";
import Config from "../utils/config";
import { desktop } from "../common/desktop-bridge";
import {
  THEME_COMPATIBILITY_VERSION,
  ThemeDark,
  ThemeDefinition,
  ThemeLight
} from "@notesnook/theme";
import { ThemesRouter } from "../common/themes-router";

type ColorScheme = "dark" | "light";
class ThemeStore extends BaseStore<ThemeStore> {
  colorScheme: "dark" | "light" = Config.get("colorScheme", "light");
  darkTheme = getTheme("dark");
  lightTheme = getTheme("light");
  followSystemTheme = Config.get("followSystemTheme", false);

  init = async () => {
    const { darkTheme, lightTheme, colorScheme } = this.get();
    await changeDesktopTheme(
      colorScheme === "dark" ? darkTheme : lightTheme,
      this.get().followSystemTheme
    );
    this.set({
      darkTheme: await updateTheme(darkTheme),
      lightTheme: await updateTheme(lightTheme)
    });
  };

  setTheme = (theme: ThemeDefinition) => {
    changeDesktopTheme(theme, this.get().followSystemTheme);
    Config.set(`theme:${theme.colorScheme}`, theme);
    this.set({
      [getKey(theme)]: theme,
      colorScheme: theme.colorScheme
    });
  };

  setColorScheme = async (colorScheme: ColorScheme) => {
    const theme = getTheme(colorScheme);
    this.set({ colorScheme, [getKey(theme)]: theme });
    changeDesktopTheme(theme, this.get().followSystemTheme);

    updateTheme(theme).then((theme) => {
      changeDesktopTheme(theme, this.get().followSystemTheme);
      Config.set("colorScheme", colorScheme);
      Config.set(`theme:${theme.colorScheme}`, theme);
      this.set({ [getKey(theme)]: theme });
    });
  };

  toggleColorScheme = () => {
    const theme = this.get().colorScheme;
    this.setColorScheme(theme === "dark" ? "light" : "dark");
  };

  setFollowSystemTheme = async (followSystemTheme: boolean) => {
    this.set({ followSystemTheme });
    Config.set("followSystemTheme", followSystemTheme);
    await desktop?.integration.changeTheme.mutate({
      theme: followSystemTheme ? "system" : this.get().colorScheme
    });
  };

  toggleFollowSystemTheme = () => {
    const followSystemTheme = this.get().followSystemTheme;
    this.setFollowSystemTheme(!followSystemTheme);
  };

  isThemeCurrentlyApplied = (id: string) => {
    return this.get().darkTheme.id === id || this.get().lightTheme.id === id;
  };
}

const [useStore, store] = createStore<ThemeStore>(
  (set, get) => new ThemeStore(set, get)
);
export { useStore, store };

function getKey(theme: ThemeDefinition) {
  return theme.colorScheme === "dark" ? "darkTheme" : "lightTheme";
}

function getTheme(colorScheme: ColorScheme) {
  return colorScheme === "dark"
    ? Config.get("theme:dark", ThemeDark)
    : Config.get("theme:light", ThemeLight);
}

async function updateTheme(theme: ThemeDefinition) {
  const { id, version } = theme;
  try {
    const updatedTheme = await ThemesRouter.updateTheme.query({
      compatibilityVersion: THEME_COMPATIBILITY_VERSION,
      id,
      version
    });
    if (!updatedTheme) return theme;
    return updatedTheme;
  } catch (e) {
    return theme;
  }
}

function changeDesktopTheme(theme: ThemeDefinition, system: boolean) {
  return desktop?.integration.changeTheme.mutate({
    theme: system ? "system" : theme.colorScheme,
    backgroundColor: theme.scopes.base.primary.background,
    windowControlsIconColor: theme.scopes.base.primary.icon
  });
}
