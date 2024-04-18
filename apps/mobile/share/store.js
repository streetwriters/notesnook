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

import { ThemeDark, ThemeLight, useThemeEngineStore } from "@notesnook/theme";
import { Appearance } from "react-native";
import create from "zustand";
import { db, setupDatabase } from "../app/common/database";
import { MMKV } from "../app/common/database/mmkv";

export async function initDatabase() {
  if (!db.isInitialized) {
    await setupDatabase();
    await db.init();
  }
}

const StorageKeys = {
  appendNote: "shareMenuAppendNote",
  selectedNotebooks: "shareMenuSelectedNotebooks",
  selectedTag: "shareMenuSelectedTag",
  appSettings: "appSettings"
};

let appSettings = MMKV.getString(StorageKeys.appSettings);
if (appSettings) {
  appSettings = JSON.parse(appSettings);
}

const systemColorScheme = Appearance.getColorScheme();
const appColorScheme = appSettings?.colorScheme;
const useSystemTheme = appSettings?.useSystemTheme;
const currentColorScheme = useSystemTheme ? systemColorScheme : appColorScheme;

const theme =
  currentColorScheme === "dark"
    ? appSettings?.darkTheme
    : appSettings?.lightTheme;

const currentTheme =
  theme || (currentColorScheme === "dark" ? ThemeDark : ThemeLight);

useThemeEngineStore.getState().setTheme(currentTheme);

export const useShareStore = create((set) => ({
  theme: currentTheme,
  appendNote: null,
  setAppendNote: (noteId) => {
    MMKV.setItem(StorageKeys.appendNote, noteId);
    set({ appendNote: noteId });
  },
  restore: () => {
    let appendNote = MMKV.getString(StorageKeys.appendNote);
    let selectedNotebooks = MMKV.getString(StorageKeys.selectedNotebooks);
    let selectedTags = MMKV.getString(StorageKeys.selectedTag);
    appendNote = JSON.parse(appendNote);
    set({
      appendNote: appendNote,
      selectedNotebooks: selectedNotebooks ? JSON.parse(selectedNotebooks) : [],
      selectedTag: selectedTags ? JSON.parse(selectedTags) : []
    });
  },
  selectedTags: [],
  selectedNotebooks: [],
  setSelectedNotebooks: (selectedNotebooks) => {
    MMKV.setItem(
      StorageKeys.selectedNotebooks,
      JSON.stringify(selectedNotebooks)
    );
    set({ selectedNotebooks });
  },
  setSelectedTags: (selectedTags) => {
    MMKV.setItem(StorageKeys.selectedTag, JSON.stringify(selectedTags));
    set({ selectedTags });
  }
}));

export const Config = {
  corsProxy: appSettings?.corsProxy
};
