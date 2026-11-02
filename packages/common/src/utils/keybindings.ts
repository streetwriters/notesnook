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

import { strings } from "@notesnook/intl";

interface Hotkeys {
  keys: (isDesktop: boolean) => string[];
  description: () => string;
  category: () => string;
  type: "hotkeys";
}

interface TipTapKey {
  keys: string | string[];
  description: () => string;
  category: () => string;
  type: "tiptap";
}

export const CATEGORIES = [
  strings.general,
  strings.navigation,
  strings.editor
] as const;

/**
 * consumed by hotkeys-js
 */
export const hotkeys = {
  nextTab: {
    keys: normalizeKeys({
      web: ["ctrl+alt+right", "ctrl+alt+shift+right"],
      desktop: ["ctrl+tab"]
    }),
    description: strings.nextTab,
    category: strings.navigation,
    type: "hotkeys"
  },
  previousTab: {
    keys: normalizeKeys({
      web: ["ctrl+alt+left", "ctrl+alt+shift+left"],
      desktop: ["ctrl+shift+tab"]
    }),
    description: strings.previousTab,
    category: strings.navigation,
    type: "hotkeys"
  },
  newTab: {
    keys: normalizeKeys({
      desktop: ["ctrl+t"]
    }),
    description: strings.newTab,
    category: strings.navigation,
    type: "hotkeys"
  },
  closeActiveTab: {
    keys: normalizeKeys({
      desktop: ["ctrl+w"]
    }),
    description: strings.closeActiveTab,
    category: strings.navigation,
    type: "hotkeys"
  },
  closeAllTabs: {
    keys: normalizeKeys({
      desktop: ["ctrl+shift+w"]
    }),
    description: strings.closeAllTabs,
    category: strings.navigation,
    type: "hotkeys"
  },
  newNote: {
    keys: normalizeKeys({
      desktop: ["ctrl+n"]
    }),
    description: strings.newNote,
    category: strings.general,
    type: "hotkeys"
  },
  searchInNotes: {
    keys: normalizeKeys(["ctrl+f"]),
    description: strings.searchInNotesListView,
    category: strings.general,
    type: "hotkeys"
  },
  openCommandPalette: {
    keys: normalizeKeys(["ctrl+shift+p", "ctrl+shift+:"]),
    description: strings.commandPalette,
    category: strings.navigation,
    type: "hotkeys"
  },
  openQuickOpen: {
    keys: normalizeKeys(["ctrl+p"]),
    description: strings.quickOpen,
    category: strings.navigation,
    type: "hotkeys"
  },
  openSettings: {
    keys: normalizeKeys(["ctrl+,"]),
    description: strings.settings,
    category: strings.general,
    type: "hotkeys"
  },
  openKeyboardShortcuts: {
    keys: normalizeKeys(["ctrl+/"]),
    description: strings.keyboardShortcuts,
    category: strings.general,
    type: "hotkeys"
  }
} satisfies Record<string, Hotkeys>;

/**
 * consumed by tiptap
 */
export const tiptapKeys = {
  addAttachment: {
    keys: "Mod-Shift-A",
    description: strings.addAttachment,
    category: strings.editor,
    type: "tiptap"
  },
  insertBlockquote: {
    keys: "Mod-Shift-B",
    description: strings.insertBlockquote,
    category: strings.editor,
    type: "tiptap"
  },
  toggleBold: {
    keys: "Mod-b",
    description: strings.toggleBold,
    category: strings.editor,
    type: "tiptap"
  },
  toggleBulletList: {
    keys: "Mod-Shift-8",
    description: strings.toggleBulletList,
    category: strings.editor,
    type: "tiptap"
  },
  toggleCheckList: {
    keys: "Mod-Shift-9",
    description: strings.toggleCheckList,
    category: strings.editor,
    type: "tiptap"
  },
  splitListItem: {
    keys: "Enter",
    description: strings.splitListItem,
    category: strings.editor,
    type: "tiptap"
  },
  liftListItem: {
    keys: "Shift-Tab",
    description: strings.liftListItem,
    category: strings.editor,
    type: "tiptap"
  },
  sinkListItem: {
    keys: "Tab",
    description: strings.sinkListItem,
    category: strings.editor,
    type: "tiptap"
  },
  toggleCode: {
    keys: "Mod-e",
    description: strings.toggleCode,
    category: strings.editor,
    type: "tiptap"
  },
  toggleCodeBlock: {
    keys: "Mod-Shift-C",
    description: strings.toggleCodeBlock,
    category: strings.editor,
    type: "tiptap"
  },
  insertDate: {
    keys: "Alt-d",
    description: strings.insertDate,
    category: strings.editor,
    type: "tiptap"
  },
  insertTime: {
    keys: "Alt-t",
    description: strings.insertTime,
    category: strings.editor,
    type: "tiptap"
  },
  insertDateTime: {
    keys: "Mod-Alt-d",
    description: strings.insertDateTime,
    category: strings.editor,
    type: "tiptap"
  },
  insertDateTimeWithTimezone: {
    keys: "Mod-Alt-z",
    description: strings.insertDateTimeWithTimezone,
    category: strings.editor,
    type: "tiptap"
  },
  increaseFontSize: {
    keys: "Mod-[",
    description: strings.increaseFontSize,
    category: strings.editor,
    type: "tiptap"
  },
  decreaseFontSize: {
    keys: "Mod-]",
    description: strings.decreaseFontSize,
    category: strings.editor,
    type: "tiptap"
  },
  insertParagraph: {
    keys: "Mod-Alt-0",
    description: strings.insertParagraph,
    category: strings.editor,
    type: "tiptap"
  },
  insertHeading1: {
    keys: "Mod-Alt-1",
    description: strings.insertHeading1,
    category: strings.editor,
    type: "tiptap"
  },
  insertHeading2: {
    keys: "Mod-Alt-2",
    description: strings.insertHeading2,
    category: strings.editor,
    type: "tiptap"
  },
  insertHeading3: {
    keys: "Mod-Alt-3",
    description: strings.insertHeading3,
    category: strings.editor,
    type: "tiptap"
  },
  insertHeading4: {
    keys: "Mod-Alt-4",
    description: strings.insertHeading4,
    category: strings.editor,
    type: "tiptap"
  },
  insertHeading5: {
    keys: "Mod-Alt-5",
    description: strings.insertHeading5,
    category: strings.editor,
    type: "tiptap"
  },
  insertHeading6: {
    keys: "Mod-Alt-6",
    description: strings.insertHeading6,
    category: strings.editor,
    type: "tiptap"
  },
  undo: {
    keys: "Mod-z",
    description: strings.undo,
    category: strings.editor,
    type: "tiptap"
  },
  redo: {
    keys: ["Mod-Shift-z", "Mod-y"],
    description: strings.redo,
    category: strings.editor,
    type: "tiptap"
  },
  addImage: {
    keys: "Mod-Shift-I",
    description: strings.addImage,
    category: strings.editor,
    type: "tiptap"
  },
  toggleItalic: {
    keys: "Mod-i",
    description: strings.toggleItalic,
    category: strings.editor,
    type: "tiptap"
  },
  removeFormattingInSelection: {
    keys: "Mod-\\",
    description: strings.removeFormattingInSelection,
    category: strings.editor,
    type: "tiptap"
  },
  insertInternalLink: {
    keys: "Mod-Shift-K",
    description: strings.insertInternalLink,
    category: strings.editor,
    type: "tiptap"
  },
  insertLink: {
    keys: "Mod-k",
    description: strings.insertLink,
    category: strings.editor,
    type: "tiptap"
  },
  insertMathBlock: {
    keys: "Mod-Shift-M",
    description: strings.insertMathBlock,
    category: strings.editor,
    type: "tiptap"
  },
  toggleOrderedList: {
    keys: "Mod-Shift-7",
    description: strings.toggleOrderedList,
    category: strings.editor,
    type: "tiptap"
  },
  toggleOutlineList: {
    keys: "Mod-Shift-O",
    description: strings.toggleOutlineList,
    category: strings.editor,
    type: "tiptap"
  },
  toggleOutlineListExpand: {
    keys: "Mod-Space",
    description: strings.toggleOutlineListExpand,
    category: strings.editor,
    type: "tiptap"
  },
  openSearch: {
    keys: "Mod-f",
    description: strings.openSearch,
    category: strings.editor,
    type: "tiptap"
  },
  openSearchAndReplace: {
    keys: "Mod-Alt-f",
    description: strings.openSearchAndReplace,
    category: strings.editor,
    type: "tiptap"
  },
  toggleStrike: {
    keys: "Mod-Shift-S",
    description: strings.toggleStrike,
    category: strings.editor,
    type: "tiptap"
  },
  toggleSubscript: {
    keys: "Mod-,",
    description: strings.toggleSubscript,
    category: strings.editor,
    type: "tiptap"
  },
  toggleSuperscript: {
    keys: "Mod-.",
    description: strings.toggleSuperscript,
    category: strings.editor,
    type: "tiptap"
  },
  toggleTaskList: {
    keys: "Mod-Shift-T",
    description: strings.toggleTaskList,
    category: strings.editor,
    type: "tiptap"
  },
  textAlignCenter: {
    keys: "Mod-Shift-E",
    description: strings.textAlignCenter,
    category: strings.editor,
    type: "tiptap"
  },
  textAlignJustify: {
    keys: "Mod-Shift-J",
    description: strings.textAlignJustify,
    category: strings.editor,
    type: "tiptap"
  },
  textAlignLeft: {
    keys: "Mod-Shift-L",
    description: strings.textAlignLeft,
    category: strings.editor,
    type: "tiptap"
  },
  textAlignRight: {
    keys: "Mod-Shift-R",
    description: strings.textAlignRight,
    category: strings.editor,
    type: "tiptap"
  },
  underline: {
    keys: "Mod-u",
    description: strings.underline,
    category: strings.editor,
    type: "tiptap"
  },
  toggleHighlight: {
    keys: "Mod-Alt-h",
    description: strings.toggleHighlight,
    category: strings.editor,
    type: "tiptap"
  },
  toggleTextColor: {
    keys: "Mod-Alt-c",
    description: strings.toggleTextColor,
    category: strings.editor,
    type: "tiptap"
  },
  moveLineUp: {
    keys: "Alt-ArrowUp",
    description: strings.moveLineUp,
    category: strings.editor,
    type: "tiptap"
  },
  moveLineDown: {
    keys: "Alt-ArrowDown",
    description: strings.moveLineDown,
    category: strings.editor,
    type: "tiptap"
  },
  moveNodeUp: {
    keys: "Alt-Shift-ArrowUp",
    description: strings.moveNodeUp,
    category: strings.editor,
    type: "tiptap"
  },
  moveNodeDown: {
    keys: "Alt-Shift-ArrowDown",
    description: strings.moveNodeDown,
    category: strings.editor,
    type: "tiptap"
  },
  clearCurrentLine: {
    keys: "Mod-l",
    description: strings.clearCurrentLine,
    category: strings.editor,
    type: "tiptap"
  }
} satisfies Record<string, TipTapKey>;

export const keybindings = {
  ...hotkeys,
  ...tiptapKeys
};

export function getKeybinding(
  key: keyof typeof keybindings,
  isDesktop = false,
  isMac = false
) {
  const keybinding = keybindings[key];
  if (keybinding.type === "hotkeys") {
    const hotkeys = keybinding.keys(isDesktop);
    return isMac ? hotkeys.map(macify) : hotkeys;
  }
  const tiptapKeys = Array.isArray(keybinding.keys)
    ? keybinding.keys
    : [keybinding.keys];
  return isMac ? tiptapKeys.map(macify) : tiptapKeys;
}

function normalizeKeys(
  keys: string[] | { web?: string[]; desktop?: string[] }
): (isDesktop?: boolean) => string[] {
  return (isDesktop = false) => {
    let keyList: string[] = [];
    if (Array.isArray(keys)) {
      keyList = keys;
    } else {
      keyList = isDesktop ? keys.desktop ?? [] : keys.web ?? [];
    }
    return keyList;
  };
}

export function macify(key: string) {
  return key
    .replace(/ctrl/gi, "Command")
    .replace(/alt/gi, "Option")
    .replace(/mod/gi, "Command");
}

export function formatKey(key: string, isMac = false, separator = " ") {
  return key
    .replace(/\+|-/g, separator)
    .replace(/\bcommand\b/gi, isMac ? "⌘" : "Ctrl")
    .replace(/\bctrl\b/gi, isMac ? "⌘" : "Ctrl")
    .replace(/\bmod\b/gi, isMac ? "⌘" : "Ctrl")
    .replace(/\balt\b/gi, isMac ? "⌥" : "Alt")
    .replace(/\boption\b/gi, isMac ? "⌥" : "Alt")
    .replace(/\bshift\b/gi, "⇧")
    .replace(/\bright\b/gi, "→")
    .replace(/\bleft\b/gi, "←")
    .replace(/\benter\b/gi, "↵")
    .replace(/\barrowup\b/gi, "↑")
    .replace(/\barrowdown\b/gi, "↓")
    .replace(/\b\w\b/gi, (e) => e.toUpperCase())
    .trim();
}

export function getGroupedKeybindings(isDesktop: boolean, isMac: boolean) {
  const grouped: {
    shortcuts: { keys: string[]; description: string }[];
    category: string;
  }[] = CATEGORIES.map((c) => ({
    category: c(),
    shortcuts: []
  }));

  const allKeybindings = { ...hotkeys, ...tiptapKeys };

  for (const key in allKeybindings) {
    const binding = allKeybindings[key as keyof typeof allKeybindings];
    let keys =
      typeof binding.keys === "function"
        ? binding.keys(isDesktop)
        : binding.keys;
    if (!keys || !keys.length) continue;

    if (isMac) {
      keys = Array.isArray(keys) ? keys.map(macify) : macify(keys);
    }

    const group = grouped.find((g) => g.category === binding.category());
    if (!group) throw new Error("Invalid group category: " + binding.category());

    group.shortcuts.push({
      keys: Array.isArray(keys) ? keys : [keys],
      description: binding.description()
    });
  }

  return grouped;
}
