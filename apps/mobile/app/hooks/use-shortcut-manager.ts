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
import Shortcuts, { ShortcutItem } from "react-native-actions-shortcuts";
import { NativeEventEmitter, NativeModule, Platform } from "react-native";
import deviceInfoModule from "react-native-device-info";
import { strings } from "@notesnook/intl";
import { useSettingStore } from "../stores/use-setting-store";

const ShortcutsEmitter = new NativeEventEmitter(
  Shortcuts as unknown as NativeModule
);

export function isShortcutsSupported() {
  return Platform.OS !== "android" || deviceInfoModule.getApiLevelSync() > 25;
}

const defaultShortcuts: ShortcutItem[] = [
  {
    type: "notesnook.action.newnote",
    title: strings.createNewNote(),
    shortTitle: strings.newNote(),
    iconName: Platform.OS === "android" ? "ic_newnote" : "plus"
  },
  {
    type: "notesnook.action.newreminder",
    title: strings.setReminder(),
    shortTitle: strings.newReminder(),
    iconName: Platform.OS === "android" ? "ic_newnote" : "plus"
  }
];

export function registerAppShortcuts(
  shortcuts: ShortcutItem[] = defaultShortcuts
) {
  if (!isShortcutsSupported()) return;
  Shortcuts.setShortcuts(shortcuts);
}

let listenerInitialized = false;
export function initShortcutListener() {
  if (!isShortcutsSupported() || listenerInitialized) return;
  listenerInitialized = true;
  ShortcutsEmitter.addListener(
    "onShortcutItemPressed",
    (shortcut: ShortcutItem) => {
      useSettingStore.setState({ pendingShortcut: shortcut });
    }
  );
}
