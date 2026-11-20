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

import { ToolDefinition } from "./types.js";
import { ToolId } from "./tools/index.js";
import { strings } from "@notesnook/intl";
import { TOOLS, TOOLBAR_PRESETS } from "../toolbar-data/index.js";

export {
  STATIC_TOOLBAR_GROUPS,
  MOBILE_STATIC_TOOLBAR_GROUPS,
  READONLY_MOBILE_STATIC_TOOLBAR_GROUPS,
  READONLY_MOBILE_TOOLBAR_NODES
} from "../toolbar-data/index.js";

/**
 * The tool data holds the name of the intl string, not the string, so it stays
 * serializable. The title is resolved here, at call time, in the current
 * locale.
 */
function resolveTitle(titleKey: string): string {
  if (!titleKey) return "";
  return (strings as unknown as Record<string, () => string>)[titleKey]();
}

const tools = (): Record<ToolId, ToolDefinition> => {
  const result = {} as Record<ToolId, ToolDefinition>;
  for (const id of Object.keys(TOOLS) as ToolId[]) {
    const { titleKey, ...rest } = TOOLS[id];
    result[id] = { ...rest, title: resolveTitle(titleKey) };
  }
  return result;
};

export function getToolDefinition(id: ToolId) {
  return tools()[id];
}

export function getAllTools() {
  return tools();
}

export function getDefaultPresets() {
  return TOOLBAR_PRESETS;
}
