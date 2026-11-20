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
import { strings } from "@notesnook/intl";
import { MMKVLoader, ProcessingModes } from "react-native-mmkv-storage";
import { NativeModules, Platform } from "react-native";

export type IOSWidgetKind =
  | "NotesWidget"
  | "NotesListWidget"
  | "RemindersWidget"
  | "NotePreviewWidget";

export type IOSWidgetKey = string;

let storage: ReturnType<MMKVLoader["initialize"]> | undefined;

function getStorage() {
  if (!storage) {
    storage = new MMKVLoader()
      .withInstanceID("widgets")
      .setProcessingMode(ProcessingModes.MULTI_PROCESS)
      .disableIndexing()
      .initialize();
  }
  return storage;
}

function getLocalizedStrings() {
  return {
    quickNote: strings.quickNoteTitle(),
    newNote: strings.newNote(),
    recentNotes: strings.recent(),
    reminders: strings.reminders(),
    untitled: strings.untitledNote(),
    ongoing: strings.ongoing(),
    snoozedUntil: strings.snoozedUntil("%@")
  };
}

export const IOSWidgets = {
  isSupported: Platform.OS === "ios",

  write(key: IOSWidgetKey, value: unknown) {
    if (!IOSWidgets.isSupported) return;
    getStorage().setString(key, JSON.stringify(value));
  },

  publish(key: IOSWidgetKey, value: unknown, kinds: IOSWidgetKind[]) {
    if (!IOSWidgets.isSupported) return;
    IOSWidgets.write(key, value);
    IOSWidgets.write("strings", getLocalizedStrings());
    IOSWidgets.reload(kinds);
  },

  remove(key: IOSWidgetKey) {
    if (!IOSWidgets.isSupported) return;
    getStorage().removeItem(key);
  },

  read<T>(key: IOSWidgetKey, fallback: T): T {
    if (!IOSWidgets.isSupported) return fallback;
    try {
      const value = getStorage().getString(key);
      return value ? (JSON.parse(value) as T) : fallback;
    } catch {
      return fallback;
    }
  },

  reload(kinds: IOSWidgetKind[] = []) {
    if (!IOSWidgets.isSupported) return;
    NativeModules.NNWidgets?.reload(kinds);
  }
};
