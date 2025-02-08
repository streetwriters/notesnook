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
import { useEditorStore } from "../stores/editor-store";
import { useStore as useSearchStore } from "../stores/search-store";
import { useEditorManager } from "../components/editor/manager";

function isInEditor(e: KeyboardEvent) {
  return (
    e.target instanceof HTMLElement && !!e.target?.closest(".editor-container")
  );
}

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
    keys: [
      "command+option+right",
      "ctrl+alt+right",
      "command+option+shift+right",
      "ctrl+alt+shift+right",
      "ctrl+tab",
      "command+tab"
    ],
    description: "Go to next tab",
    action: () => useEditorStore.getState().focusNextTab()
  },
  {
    keys: [
      "command+option+left",
      "ctrl+alt+left",
      "command+option+shift+left",
      "ctrl+alt+shift+left",
      "ctrl+shift+tab",
      "command+shift+tab"
    ],
    description: "Go to previous tab",
    action: () => useEditorStore.getState().focusPreviousTab()
  },
  {
    keys: ["ctrl+t", "command+t"],
    description: "Create a new tab",
    action: () => useEditorStore.getState().addTab()
  },
  {
    keys: ["ctrl+n", "command+n"],
    description: "Create a new note",
    action: () => useEditorStore.getState().newSession()
  },
  {
    keys: ["ctrl+w", "command+w"],
    description: "Close active tab",
    action: () => useEditorStore.getState().closeActiveTab()
  },
  {
    keys: ["ctrl+shift+w", "command+shift+w"],
    description: "Close all tabs",
    action: () => useEditorStore.getState().closeAllTabs()
  },
  {
    keys: ["command+f", "ctrl+f"],
    description: "Search all notes",
    global: false,
    action: (e: KeyboardEvent) => {
      if (isInEditor(e)) {
        const activeSession = useEditorStore.getState().getActiveSession();
        if (activeSession?.type === "readonly") {
          e.preventDefault();
          const editor = useEditorManager
            .getState()
            .getEditor(activeSession.id);
          editor?.editor?.startSearch();
        }
        return;
      }
      e.preventDefault();

      useSearchStore.setState({ isSearching: true, searchType: "notes" });
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
    hotkeys(key.keys.join(","), (e) => {
      e.preventDefault();
      key.action?.(e);
    });
  });
}
