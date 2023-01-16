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
import changeAppTheme from "../commands/change-app-theme";
import { getDefaultAccentColor } from "@notesnook/theme";

class ThemeStore extends BaseStore {
  /**
   * @type {"dark" | "light"}
   */
  theme = Config.get("theme", "light");
  accent = Config.get("accent", getDefaultAccentColor());
  followSystemTheme = Config.get("followSystemTheme", false);

  setTheme = (theme) => {
    if (!this.get().followSystemTheme) changeAppTheme(theme);
    this.set((state) => (state.theme = theme));
    Config.set("theme", theme);
  };

  toggleNightMode = () => {
    const theme = this.get().theme;
    this.setTheme(theme === "dark" ? "light" : "dark");
  };

  setAccent = (accent) => {
    this.set((state) => (state.accent = accent));
    Config.set("accent", accent);
  };

  setFollowSystemTheme = (followSystemTheme) => {
    this.set((state) => (state.followSystemTheme = followSystemTheme));
    Config.set("followSystemTheme", followSystemTheme);
    changeAppTheme(followSystemTheme ? "system" : "light");
  };

  toggleFollowSystemTheme = () => {
    const followSystemTheme = this.get().followSystemTheme;
    this.setFollowSystemTheme(!followSystemTheme);
  };
}

/**
 * @type {[import("zustand").UseStore<ThemeStore>, ThemeStore]}
 */
const [useStore, store] = createStore(ThemeStore);
export { useStore, store };
