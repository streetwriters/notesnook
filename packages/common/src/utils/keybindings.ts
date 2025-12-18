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

interface Hotkeys {
  keys: (isDesktop: boolean) => string[];
  description: string;
  category: Category;
  type: "hotkeys";
}

interface TipTapKey {
  keys: string | string[];
  description: string;
  category: Category;
  type: "tiptap";
}

type Category = (typeof CATEGORIES)[number];

export const CATEGORIES = ["General", "Navigation", "Editor"] as const;

/**
 * consumed by hotkeys-js
 */
export const hotkeys = {
  nextTab: {
    keys: normalizeKeys({
      web: ["ctrl+alt+right", "ctrl+alt+shift+right"],
      desktop: ["ctrl+tab"]
    }),
    description: "Next tab",
    category: "Navigation",
    type: "hotkeys"
  },
  previousTab: {
    keys: normalizeKeys({
      web: ["ctrl+alt+left", "ctrl+alt+shift+left"],
      desktop: ["ctrl+shift+tab"]
    }),
    description: "Previous tab",
    category: "Navigation",
    type: "hotkeys"
  },
  newTab: {
    keys: normalizeKeys({
      desktop: ["ctrl+t"]
    }),
    description: "New tab",
    category: "Navigation",
    type: "hotkeys"
  },
  closeActiveTab: {
    keys: normalizeKeys({
      desktop: ["ctrl+w"]
    }),
    description: "Close active tab",
    category: "Navigation",
    type: "hotkeys"
  },
  closeAllTabs: {
    keys: normalizeKeys({
      desktop: ["ctrl+shift+w"]
    }),
    description: "Close all tabs",
    category: "Navigation",
    type: "hotkeys"
  },
  newNote: {
    keys: normalizeKeys({
      desktop: ["ctrl+n"]
    }),
    description: "New note",
    category: "General",
    type: "hotkeys"
  },
  searchInNotes: {
    keys: normalizeKeys(["ctrl+f"]),
    description: "Search in notes list view if editor is not focused",
    category: "General",
    type: "hotkeys"
  },
  openCommandPalette: {
    keys: normalizeKeys({
      desktop: ["ctrl+shift+p"],
      web: ["ctrl+shift+p", "ctrl+shift+:"]
    }),
    description: "Command palette",
    category: "Navigation",
    type: "hotkeys"
  },
  openQuickOpen: {
    keys: normalizeKeys(["ctrl+p"]),
    description: "Quick open",
    category: "Navigation",
    type: "hotkeys"
  },
  openSettings: {
    keys: normalizeKeys(["ctrl+,"]),
    description: "Settings",
    category: "General",
    type: "hotkeys"
  },
  openKeyboardShortcuts: {
    keys: normalizeKeys(["ctrl+/"]),
    description: "Keyboard shortcuts",
    category: "General",
    type: "hotkeys"
  }
} satisfies Record<string, Hotkeys>;

/**
 * consumed by tiptap
 */
export const tiptapKeys = {
  addAttachment: {
    keys: "Mod-Shift-A",
    description: "Add attachment",
    category: "Editor",
    type: "tiptap"
  },
  insertBlockquote: {
    keys: "Mod-Shift-B",
    description: "Insert blockquote",
    category: "Editor",
    type: "tiptap"
  },
  toggleBold: {
    keys: "Mod-b",
    description: "Toggle bold",
    category: "Editor",
    type: "tiptap"
  },
  toggleBulletList: {
    keys: "Mod-Shift-8",
    description: "Toggle bullet list",
    category: "Editor",
    type: "tiptap"
  },
  toggleCheckList: {
    keys: "Mod-Shift-9",
    description: "Toggle check list",
    category: "Editor",
    type: "tiptap"
  },
  splitListItem: {
    keys: "Enter",
    description: "Split list item",
    category: "Editor",
    type: "tiptap"
  },
  liftListItem: {
    keys: "Shift-Tab",
    description: "Lift list item",
    category: "Editor",
    type: "tiptap"
  },
  sinkListItem: {
    keys: "Mod-Shift-Down",
    description: "Sink list item",
    category: "Editor",
    type: "tiptap"
  },
  toggleCode: {
    keys: "Mod-e",
    description: "Toggle code",
    category: "Editor",
    type: "tiptap"
  },
  toggleCodeBlock: {
    keys: "Mod-Shift-C",
    description: "Toggle code block",
    category: "Editor",
    type: "tiptap"
  },
  insertDate: {
    keys: "Alt-d",
    description: "Insert date",
    category: "Editor",
    type: "tiptap"
  },
  insertTime: {
    keys: "Alt-t",
    description: "Insert time",
    category: "Editor",
    type: "tiptap"
  },
  insertDateTime: {
    keys: "Mod-Alt-d",
    description: "Insert date and time",
    category: "Editor",
    type: "tiptap"
  },
  insertDateTimeWithTimezone: {
    keys: "Mod-Alt-z",
    description: "Insert date and time with timezone",
    category: "Editor",
    type: "tiptap"
  },
  increaseFontSize: {
    keys: "Ctrl-[",
    description: "Increase font size",
    category: "Editor",
    type: "tiptap"
  },
  decreaseFontSize: {
    keys: "Ctrl-]",
    description: "Decrease font size",
    category: "Editor",
    type: "tiptap"
  },
  insertParagraph: {
    keys: "Mod-Alt-0",
    description: "Insert paragraph",
    category: "Editor",
    type: "tiptap"
  },
  insertHeading1: {
    keys: "Mod-Alt-1",
    description: "Insert heading 1",
    category: "Editor",
    type: "tiptap"
  },
  insertHeading2: {
    keys: "Mod-Alt-2",
    description: "Insert heading 2",
    category: "Editor",
    type: "tiptap"
  },
  insertHeading3: {
    keys: "Mod-Alt-3",
    description: "Insert heading 3",
    category: "Editor",
    type: "tiptap"
  },
  insertHeading4: {
    keys: "Mod-Alt-4",
    description: "Insert heading 4",
    category: "Editor",
    type: "tiptap"
  },
  insertHeading5: {
    keys: "Mod-Alt-5",
    description: "Insert heading 5",
    category: "Editor",
    type: "tiptap"
  },
  insertHeading6: {
    keys: "Mod-Alt-6",
    description: "Insert heading 6",
    category: "Editor",
    type: "tiptap"
  },
  undo: {
    keys: "Mod-z",
    description: "Undo",
    category: "Editor",
    type: "tiptap"
  },
  redo: {
    keys: ["Mod-Shift-z", "Mod-y"],
    description: "Redo",
    category: "Editor",
    type: "tiptap"
  },
  addImage: {
    keys: "Mod-Shift-I",
    description: "Add image",
    category: "Editor",
    type: "tiptap"
  },
  toggleItalic: {
    keys: "Mod-i",
    description: "Toggle italic",
    category: "Editor",
    type: "tiptap"
  },
  removeFormattingInSelection: {
    keys: "Mod-\\",
    description: "Remove formatting in selection",
    category: "Editor",
    type: "tiptap"
  },
  insertInternalLink: {
    keys: "Mod-Shift-K",
    description: "Insert internal link",
    category: "Editor",
    type: "tiptap"
  },
  insertLink: {
    keys: "Mod-k",
    description: "Insert link",
    category: "Editor",
    type: "tiptap"
  },
  insertMathBlock: {
    keys: "Mod-Shift-M",
    description: "Insert math block",
    category: "Editor",
    type: "tiptap"
  },
  toggleOrderedList: {
    keys: "Mod-Shift-7",
    description: "Toggle ordered list",
    category: "Editor",
    type: "tiptap"
  },
  toggleOutlineList: {
    keys: "Mod-Shift-O",
    description: "Toggle outline list",
    category: "Editor",
    type: "tiptap"
  },
  toggleOutlineListExpand: {
    keys: "Mod-Space",
    description: "Toggle outline list expand",
    category: "Editor",
    type: "tiptap"
  },
  openSearch: {
    keys: "Mod-f",
    description: "Open search",
    category: "Editor",
    type: "tiptap"
  },
  openSearchAndReplace: {
    keys: "Mod-Alt-f",
    description: "Open search and replace",
    category: "Editor",
    type: "tiptap"
  },
  toggleStrike: {
    keys: "Mod-Shift-S",
    description: "Toggle strike",
    category: "Editor",
    type: "tiptap"
  },
  toggleSubscript: {
    keys: "Mod-,",
    description: "Toggle subscript",
    category: "Editor",
    type: "tiptap"
  },
  toggleSuperscript: {
    keys: "Mod-.",
    description: "Toggle superscript",
    category: "Editor",
    type: "tiptap"
  },
  toggleTaskList: {
    keys: "Mod-Shift-T",
    description: "Toggle task list",
    category: "Editor",
    type: "tiptap"
  },
  textAlignCenter: {
    keys: "Mod-Shift-E",
    description: "Text align center",
    category: "Editor",
    type: "tiptap"
  },
  textAlignJustify: {
    keys: "Mod-Shift-J",
    description: "Text align justify",
    category: "Editor",
    type: "tiptap"
  },
  textAlignLeft: {
    keys: "Mod-Shift-L",
    description: "Text align left",
    category: "Editor",
    type: "tiptap"
  },
  textAlignRight: {
    keys: "Mod-Shift-R",
    description: "Text align right",
    category: "Editor",
    type: "tiptap"
  },
  underline: {
    keys: "Mod-u",
    description: "Underline",
    category: "Editor",
    type: "tiptap"
  },
  toggleHighlight: {
    keys: "Mod-Alt-h",
    description: "Toggle highlight",
    category: "Editor",
    type: "tiptap"
  },
  toggleTextColor: {
    keys: "Mod-Alt-c",
    description: "Toggle text color",
    category: "Editor",
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
    .replace(/\b\w\b/gi, (e) => e.toUpperCase())
    .trim();
}

export function getGroupedKeybindings(isDesktop: boolean, isMac: boolean) {
  const grouped: {
    shortcuts: { keys: string[]; description: string }[];
    category: Category;
  }[] = CATEGORIES.map((c) => ({
    category: c,
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

    const group = grouped.find((g) => g.category === binding.category);
    if (!group) throw new Error("Invalid group category: " + binding.category);

    group.shortcuts.push({
      keys: Array.isArray(keys) ? keys : [keys],
      description: binding.description
    });
  }

  return grouped;
}
