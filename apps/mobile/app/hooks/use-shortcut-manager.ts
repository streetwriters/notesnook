/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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
const ShortcutsEmitter = new NativeEventEmitter(
  Shortcuts as unknown as NativeModule
);
const defaultShortcuts: ShortcutItem[] = [
  {
    type: "notesnook.action.newnote",
    title: "Create a new note",
    shortTitle: "New note",
    iconName: Platform.OS === "android" ? "ic_newnote" : "plus"
  }
];
export const useShortcutManager = ({
  onShortcutPressed,
  shortcuts = defaultShortcuts
}: {
  onShortcutPressed: (shortcut: ShortcutItem | null) => void;
  shortcuts: ShortcutItem[];
}) => {
  const initialShortcutRecieved = useRef(false);

  useEffect(() => {
    Shortcuts.setShortcuts(shortcuts);
  }, [shortcuts]);

  useEffect(() => {
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
