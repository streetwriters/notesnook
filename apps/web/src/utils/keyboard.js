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

import EventManager from "@notesnook/core/utils/event-manager";

const GlobalKeyboard = {};

const KeyboardEventManager = new EventManager();

GlobalKeyboard.addEventListener = (name, handler) => {
  KeyboardEventManager.subscribe(name, handler);
};

GlobalKeyboard.removeEventListener = (name, handler) =>
  KeyboardEventManager.unsubscribe(name, handler);

// window.addEventListener("keydown", (e) => {
//   // KeyboardEventManager.publish("keydown", e);
// });

window.addEventListener("keyup", (e) => {
  KeyboardEventManager.publish("keyup", e);
});

const selectSearchInput = () => {
  const input = document.getElementById("search-replace-input");
  if (input) input.select();
};

export { GlobalKeyboard, KeyboardEventManager, selectSearchInput };
