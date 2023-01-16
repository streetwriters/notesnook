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

import { Icons } from "@notesnook/editor/dist/toolbar/icons";
import {
  getDefaultPresets,
  getAllTools
} from "@notesnook/editor/dist/toolbar/tool-definitions";
import { ToolId } from "@notesnook/editor/dist/toolbar/tools";
import { ToolbarGroupDefinition } from "@notesnook/editor/dist/toolbar/index";
import { useThemeStore } from "../../../stores/use-theme-store";

export const tools = getAllTools();
export const presets: { [name: string]: ToolbarGroupDefinition[] } = {
  default: getDefaultPresets().default,
  minimal: getDefaultPresets().minimal,
  custom: []
};

export function findToolById(id: keyof typeof tools): {
  title: string;
  icon: string;
} {
  return tools[id];
}

export function getToolIcon(id: ToolId) {
  const icon = Icons[id as keyof typeof Icons];
  const colors = useThemeStore.getState().colors;
  return (id as "none") === "none"
    ? null
    : `<svg width="20" height="20"  >
  <path d="${icon}" fill="${colors.icon}" />
</svg>`;
}

export function getUngroupedTools(
  toolDefinition: (string | string[])[][]
): string[] {
  const keys = Object.keys(tools);

  const ungrouped = [];
  const toolString = JSON.stringify(toolDefinition);
  for (const key of keys) {
    if (tools[key as ToolId].conditional) continue;
    if (!toolString.includes(key)) ungrouped.push(key);
  }

  return ungrouped;
}
