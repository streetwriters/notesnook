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

import { ToolbarConfig, ToolbarConfigPlatforms } from "@notesnook/core";
import { database } from "../database.js";

export const CURRENT_TOOLBAR_VERSION = 2;
export async function migrateToolbar(
  platform: ToolbarConfigPlatforms,
  tools: ToolbarConfig
) {
  const version = tools.version || 0;
  if (version === CURRENT_TOOLBAR_VERSION) return tools;

  tools = runMigration(version, platform, tools);
  await database.settings.setToolbarConfig(platform, tools);
  return tools;
}

function runMigration(
  version: number,
  platform: ToolbarConfigPlatforms,
  tools: ToolbarConfig
) {
  switch (version) {
    case 0: {
      tools.config?.push(["checkList"]);
      return runMigration(1, platform, tools);
    }
    case 1: {
      const group = tools.config?.find(
        (g) => Array.isArray(g) && g.includes("addLink")
      );
      if (!group) tools.config?.push(["addInternalLink"]);
      else if (!group.includes("addInternalLink"))
        group.push("addInternalLink");

      return runMigration(2, platform, tools);
    }
    case CURRENT_TOOLBAR_VERSION:
    default:
      break;
  }
  tools.version = CURRENT_TOOLBAR_VERSION;
  return tools;
}
