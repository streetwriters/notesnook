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

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Database } from "@notesnook/core";
import { PermissionStore } from "./permissions.js";
import { registerNoteTools } from "./tools/notes.js";
import { registerNotebookTools } from "./tools/notebooks.js";
import { registerTagTools } from "./tools/tags.js";
import { registerReminderTools } from "./tools/reminders.js";
import { registerPermissionTools } from "./tools/permissions.js";
import { registerSyncTool } from "./tools/sync.js";

export function createServer(db: Database, store: PermissionStore): McpServer {
  const server = new McpServer({
    name: "notesnook",
    version: "1.0.0"
  });

  registerNoteTools(server, db, store);
  registerNotebookTools(server, db, store);
  registerTagTools(server, db, store);
  registerReminderTools(server, db);
  registerPermissionTools(server, db, store);
  registerSyncTool(server, db);

  return server;
}
