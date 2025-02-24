console.log("writing...");

import { writeFileSync } from "fs";
import { keybindings } from "./packages/common/src/utils";

const keyboardShortcutFilePath = "./docs/help/contents/keyboard-shortcuts.md";

const frontmatter = `---
title: Keyboard Shortcuts
description: Keyboard shortcuts for Notesnook
---
`;
const content =
  "The following keyboard shortcuts will help you navigate Notesnook faster.";
const header = `| Description | Shortcut |
| --- | --- |`;

const list = Object.values(keybindings).map((k) => ({
  keys:
    typeof k.keys === "string"
      ? k.keys
      : Array.isArray(k.keys)
      ? k.keys.join(", ")
      : JSON.stringify(k.keys),
  description: k.description,
  category: k.category
}));

const grouped = list.reduce((acc, curr) => {
  if (!acc[curr.category]) {
    acc[curr.category] = [];
  }
  acc[curr.category].push(curr);
  return acc;
}, {} as { [key: string]: typeof list });

const str = Object.entries(grouped)
  .map(([group, shortcuts]) => {
    return `
### ${group}
${header}
${shortcuts
  .map((shortcut) => `| ${shortcut.description} | ${shortcut.keys} |`)
  .join("\n")}`;
  })
  .join("\n");

writeFileSync(keyboardShortcutFilePath, frontmatter + content + str, "utf-8");

console.log("done");
