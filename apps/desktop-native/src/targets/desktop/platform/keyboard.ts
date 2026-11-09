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

import { Shortcut } from "@react-native-gpui/core/desktop";
import type { Keyboard, KeyEvent } from "../../../platform";

const MODIFIER_NAMES: Record<string, string> = {
  command: "mod",
  cmd: "mod",
  meta: "mod",
  mod: "mod",
  ctrl: "mod",
  control: "mod",
  option: "alt",
  alt: "alt",
  shift: "shift"
};

const KEY_NAMES: Record<string, string> = {
  arrowleft: "left",
  arrowright: "right",
  arrowup: "up",
  arrowdown: "down",
  esc: "escape",
  return: "enter"
};

function convert(keys: string) {
  const parts = keys
    .split("+")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
  const modifiers = new Set<string>();
  let key = "";
  for (const part of parts) {
    const modifier = MODIFIER_NAMES[part];
    if (modifier) modifiers.add(modifier);
    else key = KEY_NAMES[part] ?? part;
  }
  return { combo: [...modifiers, key].join("+"), modifiers, key };
}

function toEvent(keys: string): KeyEvent {
  const { modifiers, key } = convert(keys);
  return {
    key,
    code: key,
    keyCode: 0,
    ctrlKey: false,
    shiftKey: modifiers.has("shift"),
    altKey: modifiers.has("alt"),
    metaKey: modifiers.has("mod"),
    inEditor: false,
    preventDefault() {}
  };
}

let counter = 0;

export const keyboard: Keyboard = {
  onKeyUp() {
    return () => {};
  },
  register(keys, handler, options) {
    const removers = keys.map((keyString) => {
      const { combo } = convert(keyString);
      const id = `keymap:${++counter}:${combo}`;
      Shortcut.register({
        id,
        keys: combo,
        allowInTextInput: options?.allowInTextInput === true
      });
      const remove = Shortcut.addHandler(id, () => handler(toEvent(keyString)));
      return () => {
        remove();
        Shortcut.unregister(id);
      };
    });
    return () => removers.forEach((remove) => remove());
  }
};
