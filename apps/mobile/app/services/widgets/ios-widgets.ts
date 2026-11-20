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
    addQuickNote: strings.addQuickNote(),
    noNotes: strings.emptyPlaceholders("note"),
    reminders: strings.reminders(),
    noReminders: strings.tapToAddReminder(),
    untitled: strings.untitledNote(),
    chooseNoteBody: strings.tapToPickWidgetNote(),
    lockedNote: strings.noteLocked(),
    ongoing: strings.ongoing(),
    snoozedUntil: strings.snoozedUntil("%@"),
    today: strings.reminderToday("%@"),
    tomorrow: strings.reminderTomorrow("%@"),
    yesterday: strings.reminderYesterday("%@"),
    upcoming: strings.reminderUpcoming("%@"),
    last: strings.reminderLast("%@"),
    moreCount: strings.moreCount("%d")
  };
}

export const IOSWidgets = {
  isSupported: Platform.OS === "ios",

  write(key: string, value: unknown) {
    if (!IOSWidgets.isSupported) return;
    getStorage().setString(key, JSON.stringify(value));
  },

  publish(key: string, value: unknown, kinds: IOSWidgetKind[]) {
    if (!IOSWidgets.isSupported) return;
    IOSWidgets.write(key, value);
    IOSWidgets.write("strings", getLocalizedStrings());
    IOSWidgets.reload(kinds);
  },

  remove(key: string) {
    if (!IOSWidgets.isSupported) return;
    getStorage().removeItem(key);
  },

  read<T>(key: string, fallback: T): T {
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
