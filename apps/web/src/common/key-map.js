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
import { navigate } from "../navigation";
// import { store as themestore } from "../stores/theme-store";
import { GlobalKeyboard } from "../utils/keyboard";

const KEYMAP = [
  // {
  //   keys: ["command+n", "ctrl+n", "command+alt+n", "ctrl+alt+n"],
  //   description: "Create a new note",
  //   global: true,
  //   action: (e) => {
  //     e.preventDefault();
  //     hashNavigate("/notes/create", {
  //       addNonce: true,
  //       replace: true,
  //       notify: true,
  //     });
  //   },
  // },
  // {
  //   keys: [
  //     "command+shift+n",
  //     "ctrl+shift+n",
  //     "command+shift+alt+n",
  //     "ctrl+shift+alt+n",
  //   ],
  //   description: "Create a new notebook",
  //   global: true,
  //   action: (e) => {
  //     e.preventDefault();
  //     hashNavigate("/notebooks/create", {
  //       replace: true,
  //       notify: true,
  //     });
  //   },
  // },
  {
    keys: ["command+f", "ctrl+f"],
    description: "Search all notes",
    global: false,
    action: (e) => {
      if (e.target?.classList.contains("ProseMirror")) return;
      e.preventDefault();

      navigate("/search/notes");
    }
  }
  // {
  //   keys: ["alt+n"],
  //   description: "Go to Notes",
  //   global: false,
  //   action: (e) => {
  //     e.preventDefault();
  //     navigate("/notes");
  //   },
  // },
  // {
  //   keys: ["alt+b"],
  //   description: "Go to Notebooks",
  //   global: false,
  //   action: (e) => {
  //     e.preventDefault();
  //     navigate("/notebooks");
  //   },
  // },
  // {
  //   keys: ["alt+f"],
  //   description: "Go to Favorites",
  //   global: false,
  //   action: (e) => {
  //     e.preventDefault();
  //     navigate("/favorites");
  //   },
  // },
  // {
  //   keys: ["alt+t"],
  //   description: "Go to Tags",
  //   global: false,
  //   action: (e) => {
  //     e.preventDefault();
  //     navigate("/tags");
  //   },
  // },
  // {
  //   keys: ["alt+d"],
  //   description: "Go to Trash",
  //   global: false,
  //   action: (e) => {
  //     e.preventDefault();
  //     navigate("/trash");
  //   },
  // },
  // {
  //   keys: ["alt+s"],
  //   description: "Go to Settings",
  //   global: false,
  //   action: (e) => {
  //     e.preventDefault();
  //     navigate("/settings");
  //   },
  // },
  // {
  //   keys: ["command+d", "ctrl+d"],
  //   description: "Toggle dark/light mode",
  //   global: true,
  //   action: (e) => {
  //     e.preventDefault();
  //     themestore.get().toggleNightMode();
  //   },
  // },
];

export function registerKeyMap() {
  hotkeys.filter = function () {
    return true;
  };

  KEYMAP.forEach((key) => {
    hotkeys(
      key.keys.join(","),
      { element: key.global ? GlobalKeyboard : window },
      key.action
    );
  });
}
