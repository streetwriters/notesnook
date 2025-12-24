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

import { NativeModules, Platform } from "react-native";

export type ShortcutInfo = {
  id: string;
  title: string;
  description: string;
  type: "note" | "notebook" | "tag" | "color";
};

interface NotesnookModuleInterface {
  getActivityName: () => Promise<string>;
  setBackgroundColor: (color: string) => void;
  setSecureMode: (enabled: boolean) => void;
  setAppState: (appState: string) => void;
  getAppState: () => string;
  saveAndFinish: () => void;
  setString: (storeName: string, key: string, value: string) => void;
  getString: (storeName: string, key: string) => Promise<string>;
  removeString: (key: string) => void;
  cancelAndFinish: () => void;
  getWidgetId: () => void;
  getIntent: () => {
    "com.streetwriters.notesnook.OpenNoteId"?: string;
    "com.streetwriters.notesnook.OpenReminderId"?: string;
    "com.streetwriters.notesnook.NewReminder"?: string;
  };
  getWidgetNotes: () => Promise<string[]>;
  hasWidgetNote: (noteId: string) => Promise<boolean>;
  updateWidgetNote: (noteId: string, data: string) => void;
  updateReminderWidget: () => void;
  isGestureNavigationEnabled: () => boolean;
  addShortcut: (
    id: string,
    type: "note" | "notebook" | "tag" | "color",
    title: string,
    description?: string,
    color?: string
  ) => Promise<boolean>;
  removeShortcut: (id: string) => Promise<boolean>;
  updateShortcut: (
    id: string,
    type: "note" | "notebook" | "tag" | "color",
    title: string,
    description?: string,
    color?: string
  ) => Promise<boolean>;
  removeAllShortcuts: () => Promise<boolean>;
  getAllShortcuts: () => Promise<ShortcutInfo[]>;
}

export const NotesnookModule: NotesnookModuleInterface = Platform.select({
  ios: {
    getActivityName: () => {},
    setBackgroundColor: () => {},
    setSecureMode: () => {},
    setAppState: () => {},
    getAppState: () => {},
    saveAndFinish: () => {},
    getString: () => {},
    setString: () => {},
    removeString: () => {},
    cancelAndFinish: () => {},
    getWidgetId: () => {},
    getIntent: () => {},
    getWidgetNotes: () => {},
    hasWidgetNote: () => {},
    updateWidgetNote: () => {},
    updateReminderWidget: () => {},
    isGestureNavigationEnabled: () => true,
    addShortcut: () => Promise.resolve(false),
    removeShortcut: () => Promise.resolve(false),
    updateShortcut: () => Promise.resolve(false),
    removeAllShortcuts: () => Promise.resolve(false),
    getAllShortcuts: () => Promise.resolve([])
  },
  android: NativeModules.NNativeModule
});
