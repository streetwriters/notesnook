import hotkeys from "hotkeys-js";
import { hashNavigate, navigate } from "../navigation";
import { GlobalKeyboard } from "../utils/keyboard";

const KEYMAP = [
  {
    keys: ["command+n", "ctrl+n", "command+alt+n", "ctrl+alt+n"],
    description: "Create a new note",
    global: true,
    action: (e) => {
      e.preventDefault();
      hashNavigate("/notes/create", {
        addNonce: true,
        replace: true,
        notify: true,
      });
    },
  },
  {
    keys: [
      "command+shift+n",
      "ctrl+shift+n",
      "command+shift+alt+n",
      "ctrl+shift+alt+n",
    ],
    description: "Create a new notebook",
    global: true,
    action: (e) => {
      e.preventDefault();
      hashNavigate("/notebooks/create", {
        replace: true,
        notify: true,
      });
    },
  },
  {
    keys: ["command+f", "ctrl+f"],
    description: "Search all notes",
    global: false,
    action: (e) => {
      if (e.currentTarget !== window) return;
      e.preventDefault();

      navigate("/search/notes");
    },
  },
];

export function registerKeyMap() {
  hotkeys.filter = function (e) {
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
