console.log("Generating keyboard shortcuts documentation...");

import { writeFileSync } from "fs";
import { getGroupedTableKeybindingsMarkdown } from "./packages/common/src/utils/keybindings";

const keyboardShortcutFilePath = "./docs/help/contents/keyboard-shortcuts.md";

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
