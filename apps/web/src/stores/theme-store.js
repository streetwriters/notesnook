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
  ThemeLight
} from "@notesnook/theme";
import { ThemesRouter } from "../common/themes-router";

/**
 * @extends {BaseStore<ThemeStore>}
 */
class ThemeStore extends BaseStore {
  /**
   * @type {"dark" | "light"}
   */
  colorScheme = Config.get("colorScheme", "light");
  darkTheme = getTheme("dark");
  lightTheme = getTheme("light");
  followSystemTheme = Config.get("followSystemTheme", false);

  init = async () => {
    const { darkTheme, lightTheme } = this.get();
    this.set({
      darkTheme: await updateTheme(darkTheme),
      lightTheme: await updateTheme(lightTheme)
    });
  };

  /**
   * @param {import("@notesnook/theme").ThemeDefinition} theme
   */
  setTheme = (theme) => {
    Config.set(`theme:${theme.colorScheme}`, theme);
    this.set({
      [getKey(theme)]: theme,
      colorScheme: theme.colorScheme
    });
  };

  setColorScheme = async (colorScheme) => {
    if (!this.get().followSystemTheme)
      await desktop?.integration.changeTheme.mutate(colorScheme);
    const theme = getTheme(colorScheme);
    this.set({
      colorScheme,
      theme
    });
    Config.set("colorScheme", colorScheme);

    updateTheme(theme).then((theme) =>
      this.set({
        [getKey(theme)]: theme
      })
    );
  };

  toggleColorScheme = () => {
    const theme = this.get().colorScheme;
    this.setColorScheme(theme === "dark" ? "light" : "dark");
  };

  setFollowSystemTheme = async (followSystemTheme) => {
    this.set({ followSystemTheme });
    Config.set("followSystemTheme", followSystemTheme);
    await desktop?.integration.changeTheme.mutate(
      followSystemTheme ? "system" : "light"
    );
  };

  toggleFollowSystemTheme = () => {
    const followSystemTheme = this.get().followSystemTheme;
    this.setFollowSystemTheme(!followSystemTheme);
  };

  isThemeCurrentlyApplied = (id) => {
    return this.get().darkTheme.id === id || this.get().lightTheme.id === id;
  };
}

const [useStore, store] = createStore(ThemeStore);
export { useStore, store };

function getKey(theme) {
  return theme.colorScheme === "dark" ? "darkTheme" : "lightTheme";
}

function getTheme(colorScheme) {
  return colorScheme === "dark"
    ? Config.get("theme:dark", ThemeDark)
    : Config.get("theme:light", ThemeLight);
}

async function updateTheme(theme) {
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
