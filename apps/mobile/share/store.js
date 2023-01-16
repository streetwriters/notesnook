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
import create from "zustand";
import {
  ACCENT,
  COLOR_SCHEME_DARK,
  COLOR_SCHEME_LIGHT
} from "../app/utils/color-scheme";
import { MMKV } from "../app/common/database/mmkv";

export const useShareStore = create((set) => ({
  colors:
    Appearance.getColorScheme() === "dark"
      ? COLOR_SCHEME_DARK
      : COLOR_SCHEME_LIGHT,
  accent: ACCENT,
  setAccent: async () => {
    let appSettings = MMKV.getString("appSettings");

    if (appSettings) {
      appSettings = JSON.parse(appSettings);
      let accentColor = appSettings.theme?.accent || ACCENT.color;

      let accent = {
        color: accentColor,
        shade: accentColor + "12"
      };
      set({ accent: accent });
    }
  },
  setColors: () => {
    set({
      colors:
        Appearance.getColorScheme() === "dark"
          ? COLOR_SCHEME_DARK
          : COLOR_SCHEME_LIGHT
    });
  },
  appendNote: null,
  setAppendNote: (note) => {
    MMKV.setItem("shareMenuAppendNote", JSON.stringify(note));
    set({ appendNote: note });
  },
  restoreAppendNote: async () => {
    let note = MMKV.getString("shareMenuAppendNote");
    if (note) {
      note = JSON.parse(note);
      set({ appendNote: note });
    }
  }
}));
