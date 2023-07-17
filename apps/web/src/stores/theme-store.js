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
  theme = getTheme(this.colorScheme);

  followSystemTheme = Config.get("followSystemTheme", false);

  init = async () => {
    const { theme, colorScheme } = this.get();
    this.set({
      theme: await updateTheme(theme.id, theme.version, colorScheme)
    });
  };

  /**
   * @param {import("@notesnook/theme").ThemeDefinition} theme
   */
  setTheme = async (theme) => {
    Config.set(`theme:${theme.colorScheme}`, theme);
    this.set({ theme, colorScheme: theme.colorScheme });
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

    updateTheme(theme.id, theme.version, colorScheme).then((theme) =>
      this.set({ theme })
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
}

const [useStore, store] = createStore(ThemeStore);
export { useStore, store };

function getTheme(colorScheme) {
  return colorScheme === "dark"
    ? Config.get("theme:dark", ThemeDark)
    : Config.get("theme:light", ThemeLight);
}

async function updateTheme(id, version, colorScheme) {
  try {
    const theme = await ThemesRouter.updateTheme.query({
      compatibilityVersion: THEME_COMPATIBILITY_VERSION,
      id,
      version
    });
    console.log("UPDATED!", theme);
    if (!theme) return getTheme(colorScheme);
    return theme;
  } catch (e) {
    return getTheme(colorScheme);
  }
}
