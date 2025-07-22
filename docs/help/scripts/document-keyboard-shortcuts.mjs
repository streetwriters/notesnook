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
title: Keyboard Shortcuts
description: Keyboard shortcuts for Notesnook
---
`;

const content = `# Keyboard shortcuts

The following keyboard shortcuts will help you navigate Notesnook faster.`;

const markdownTable = getGroupedTableKeybindingsMarkdown();

writeFileSync(
  keyboardShortcutFilePath,
  frontmatter + "\n" + content + "\n\n" + markdownTable,
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

    return `### ${category}\n\n${header}\n${rows}`;
  }).join("\n\n");
}
