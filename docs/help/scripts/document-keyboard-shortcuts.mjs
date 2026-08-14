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

import { writeFileSync } from "fs";
import {
  getGroupedKeybindings,
  formatKey,
  macify,
  CATEGORIES
} from "@notesnook/common";

console.log("Generating keyboard shortcuts documentation...");

const keyboardShortcutFilePath = "./contents/keyboard-shortcuts.md";

const frontmatter = `---
title: Keyboard shortcuts
pageTitle: Every keyboard shortcut in Notesnook
description: The complete list of Notesnook keyboard shortcuts for web, Windows, Linux and macOS — navigation, the editor, formatting and note actions.
keywords:
  - notesnook keyboard shortcuts
  - notesnook hotkeys
  - notes app shortcuts
---
`;

const content = `# Keyboard shortcuts

These are every keyboard shortcut the Notesnook desktop and web apps respond to, grouped by what they do. Press \`Ctrl\` \`/\` (\`⌘\` \`/\` on macOS) inside the app to bring the same list up there.

::: info This page is generated from the app
The tables below are generated straight from the app's own keybinding registry, so they cannot drift out of step with the shortcuts that actually fire.
:::`;

const relatedPages = `## Related pages

- [Editor toolbar](/rich-text-editor/rich-text-editor-toolbar) — the same actions as buttons, and how to rearrange them
- [Markdown shortcuts](/rich-text-editor/markdown-notes-editing) — formatting that triggers as you type
- [Find & replace](/rich-text-editor/search-and-replace) — searching inside the note you are editing
- [Search & navigation](/search-and-navigation) — the command palette and quick open
- [Tabs & panes](/rich-text-editor/editor-tabs-and-panes) — moving between open notes`;

const markdownTable = getGroupedTableKeybindingsMarkdown();

writeFileSync(
  keyboardShortcutFilePath,
  frontmatter + "\n" + content + "\n\n" + markdownTable + "\n\n" + relatedPages + "\n",
  "utf-8"
);

console.log("Keyboard shortcuts documentation updated successfully!");

/**
 * @returns markdown formatted table of keyboard shortcuts grouped by category.
 */
function getGroupedTableKeybindingsMarkdown() {
  const desktopKeybindings = getGroupedKeybindings(true, false);
  const webKeybindings = getGroupedKeybindings(false, false);

  const header = `| Description | Web | Windows/Linux | Mac |
| --- | --- | --- | --- |`;

  return CATEGORIES.map((category) => {
    const webShortcuts =
      webKeybindings.find((g) => g.category === category)?.shortcuts || [];
    const desktopShortcuts =
      desktopKeybindings.find((g) => g.category === category)?.shortcuts || [];

    const mergedShortcuts = {};

    webShortcuts.forEach(({ description, keys }) => {
      if (!mergedShortcuts[description]) {
        mergedShortcuts[description] = {};
      }
      mergedShortcuts[description].web = keys;
    });
    desktopShortcuts.forEach(({ description, keys }) => {
      if (!mergedShortcuts[description]) {
        mergedShortcuts[description] = {};
      }
      mergedShortcuts[description].desktop = keys;
    });

    const rows = Object.entries(mergedShortcuts)
      .map(([description, { web, desktop }]) => {
        const webKeys = web?.map((k) => formatKey(k)).join(" / ") || "-";
        const windowsLinuxKeys =
          desktop?.map((k) => formatKey(k)).join(" / ") || "-";
        const macKeys =
          desktop
            ?.map(macify)
            .map((k) => formatKey(k, true))
            .join(" / ") || "-";

        return `| ${description} | ${webKeys} | ${windowsLinuxKeys} | ${macKeys} |`;
      })
      .join("\n");

    return `## ${category}\n\n${header}\n${rows}`;
  }).join("\n\n");
}
