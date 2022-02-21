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
      if (e.currentTarget !== window) return;
      e.preventDefault();

      navigate("/search/notes");
    },
  },
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
