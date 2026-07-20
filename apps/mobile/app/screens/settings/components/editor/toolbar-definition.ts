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

import { Icons } from "@notesnook/editor/dist/cjs/toolbar/icons";
import { ToolbarGroupDefinition } from "@notesnook/editor";
import {
  getAllTools,
  getDefaultPresets
} from "@notesnook/editor/dist/cjs/toolbar/tool-definitions";
import { ToolId } from "@notesnook/editor";

export const tools = () => getAllTools();
export const presets: { [name: string]: ToolbarGroupDefinition[] } = {
  default: getDefaultPresets().default as any,
  minimal: getDefaultPresets().minimal as any,
  custom: []
};

export function findToolById(id: keyof ReturnType<typeof tools>): {
  title: string;
  icon: string;
} {
  return tools()[id];
}

export function getToolIcon(id: ToolId, color: string) {
  const icon = Icons[id as keyof typeof Icons];

  return (id as "none") === "none"
    ? null
    : `<svg width="20" height="20"  >
  <path d="${icon}" fill="${color}" />
</svg>`;
}

/**
 * Maps a tool to a glyph in the custom `notesnook` icon font (see
 * `packages/icons/svgs/format-*`). Tools without an entry fall back to the
 * editor's built-in icon set via {@link getToolIcon}.
 */
const TOOL_ICON_NAMES: { [id: string]: string } = {
  bold: "format-text-b",
  italic: "format-text-italic",
  underline: "format-text-underline",
  strikethrough: "format-text-strikethrough",
  addInternalLink: "format-link",
  addLink: "format-link-simple-horizontal",
  code: "format-code-simple",
  clearformatting: "format-text-t-slash",
  subscript: "format-text-subscript",
  superscript: "format-text-superscript",
  bulletList: "format-frame",
  numberedList: "format-list-numbers",
  checkList: "format-list-dashes",
  fontFamily: "format-text-aa",
  fontSize: "format-arrows-vertical",
  headings: "format-text-h-one",
  alignment: "format-text-align-left",
  highlight: "format-highlighter",
  textColor: "format-palette",
  math: "format-math-operations"
};

export function getToolIconName(id: ToolId): string | undefined {
  return TOOL_ICON_NAMES[id as string];
}

export function getUngroupedTools(
  toolDefinition: (string | string[])[][]
): string[] {
  const allTools = tools();
  const keys = Object.keys(allTools);

  const ungrouped = [];
  const toolString = JSON.stringify(toolDefinition);
  for (const key of keys) {
    if ((allTools[key as ToolId] as any).conditional) continue;
    if (!toolString.includes(key)) ungrouped.push(key);
  }

  return ungrouped;
}
