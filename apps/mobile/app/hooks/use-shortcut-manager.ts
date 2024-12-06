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
import { useEffect } from "react";
import { NativeEventEmitter, NativeModule } from "react-native";
import { useRef } from "react";
import { Platform } from "react-native";
import { Linking } from "react-native";
import deviceInfoModule from "react-native-device-info";
import { strings } from "@notesnook/intl";
const ShortcutsEmitter = new NativeEventEmitter(
  Shortcuts as unknown as NativeModule
);

function isSupported() {
  return Platform.OS !== "android" || deviceInfoModule.getApiLevelSync() > 25;
}
const defaultShortcuts: ShortcutItem[] = [
  {
    type: "notesnook.action.newnote",
    title: strings.createNewNote(),
    shortTitle: strings.newNote(),
    iconName: Platform.OS === "android" ? "ic_newnote" : "plus"
  }
];
export const useShortcutManager = ({
  onShortcutPressed,
  shortcuts = defaultShortcuts
}: {
  onShortcutPressed: (shortcut: ShortcutItem | null) => void;
  shortcuts?: ShortcutItem[];
}) => {
  const initialShortcutRecieved = useRef(false);

  useEffect(() => {
    if (!isSupported()) return;
    Shortcuts.setShortcuts(shortcuts);
  }, [shortcuts]);

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url?.startsWith("ShareMedia://QuickNoteWidget")) {
        onShortcutPressed(defaultShortcuts[0]);
      }
    });
    if (!isSupported()) return;
    Shortcuts.getInitialShortcut().then((shortcut) => {
      if (initialShortcutRecieved.current) return;
      onShortcutPressed(shortcut);
      initialShortcutRecieved.current = true;
    });
    const subscription = ShortcutsEmitter.addListener(
      "onShortcutItemPressed",
      onShortcutPressed
    );
    return () => {
      subscription?.remove();
    };
  }, [onShortcutPressed]);
};
