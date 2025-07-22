import { writeFileSync } from "fs";
import { getGroupedKeybindings, formatKey, macify } from "@notesnook/common";

console.log("Generating keyboard shortcuts documentation...");

const keyboardShortcutFilePath = "./contents/keyboard-shortcuts.md";

const frontmatter = `---
title: Keyboard Shortcuts
description: Keyboard shortcuts for Notesnook
---
`;

const content =
  "The following keyboard shortcuts will help you navigate Notesnook faster.";

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

  return Object.keys({ ...webKeybindings, ...desktopKeybindings })
    .map((category) => {
      const webShortcuts = webKeybindings[category] || [];
      const desktopShortcuts = desktopKeybindings[category] || [];

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
    })
    .join("\n\n");
}
