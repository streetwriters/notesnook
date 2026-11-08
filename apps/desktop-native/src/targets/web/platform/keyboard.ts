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

import hotkeys from "hotkeys-js";
import type { Keyboard, KeyEvent } from "../../../platform";

function toKeyEvent(event: KeyboardEvent): KeyEvent {
  const target = event.target as HTMLElement | null;
  return {
    key: event.key,
    code: event.code,
    keyCode: event.keyCode,
    ctrlKey: event.ctrlKey,
    shiftKey: event.shiftKey,
    altKey: event.altKey,
    metaKey: event.metaKey,
    inEditor: !!target?.closest?.(".editor-container"),
    preventDefault: () => event.preventDefault()
  };
}

export const keyboard: Keyboard = {
  onKeyUp(handler) {
    const listener = (event: KeyboardEvent) => handler(toKeyEvent(event));
    window.addEventListener("keyup", listener);
    return () => window.removeEventListener("keyup", listener);
  },
  register(keys, handler) {
    hotkeys.filter = () => true;
    const combo = keys.join(",");
    hotkeys(combo, (event) => {
      handler(toKeyEvent(event));
    });
    return () => hotkeys.unbind(combo);
  }
};
