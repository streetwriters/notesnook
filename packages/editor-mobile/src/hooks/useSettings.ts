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

import { getDefaultPresets } from "@notesnook/editor";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Settings } from "../utils";

type SettingsStore = {
  settings: Settings;
  setSettings: (settings?: Partial<Settings>) => void;
};

const initialSettings = {
  fullscreen: false,
  deviceMode: "mobile",
  premium: false,
  tools: JSON.parse(JSON.stringify(getDefaultPresets().default)),
  noToolbar: globalThis.noToolbar,
  noHeader: globalThis.noHeader,
  readonly: globalThis.readonly,
  doubleSpacedLines: true,
  fontFamily: "sans-serif",
  fontSize: 16,
  timeFormat: "12-hour",
  dateFormat: "DD-MM-YYYY",
  loggedIn: false,
  defaultLineHeight: 1.2
} as Settings;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: initialSettings,
      setSettings: (settings) => {
        const nextSettings = {
          ...get().settings,
          ...settings,
          noToolbar: globalThis.noToolbar || settings?.noToolbar,
          noHeader: globalThis.noHeader || settings?.noHeader,
          readonly: globalThis.readonly || settings?.readonly
        } as Settings;

        if (JSON.stringify(nextSettings) !== JSON.stringify(get().settings)) {
          set({ settings: nextSettings });
        }
      }
    }),
    {
      name: "editorSettings",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ settings: state.settings })
    }
  )
);
