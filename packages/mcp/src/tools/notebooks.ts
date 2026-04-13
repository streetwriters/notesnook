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
import { z } from "zod";
import { PermissionStore } from "../permissions.js";

function errorContent(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

export function registerNotebookTools(
  server: McpServer,
  db: Database,
  _store: PermissionStore
): void {
  server.tool(
    "list_notebooks",
    "List all notebooks. Notebook list is always visible so the AI can request access grants.",
    {},
    async () => {
      const notebooks = await db.notebooks.all.items();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              notebooks.map((nb) => ({
                id: nb.id,
                title: nb.title,
                description: nb.description,
                dateModified: nb.dateModified
              })),
              null,
              2
            )
          }
        ]
      };
    }
  );

  server.tool(
    "create_notebook",
    "Create a new notebook.",
    {
      title: z.string().describe("Notebook title"),
      description: z.string().optional().describe("Notebook description")
    },
    async ({ title, description }) => {
      const id = await db.notebooks.add({ title, description });
      if (!id) return errorContent("Failed to create notebook");
      const nb = await db.notebooks.notebook(id);
      return {
        content: [{ type: "text", text: JSON.stringify(nb ?? { id }, null, 2) }]
      };
    }
  );

  server.tool(
    "delete_notebook",
    "Delete a notebook by ID.",
    { id: z.string().describe("Notebook ID") },
    async ({ id }) => {
      await db.notebooks.remove(id);
      return { content: [{ type: "text", text: `Notebook ${id} deleted.` }] };
    }
  );

  server.tool(
    "add_note_to_notebook",
    "Add a note to a notebook. The note must have write access.",
    {
      notebookId: z.string().describe("Notebook ID"),
      noteId: z.string().describe("Note ID")
    },
    async ({ notebookId, noteId }) => {
      await db.relations.add(
        { id: notebookId, type: "notebook" },
        { id: noteId, type: "note" }
      );
      return {
        content: [
          {
            type: "text",
            text: `Note ${noteId} added to notebook ${notebookId}.`
          }
        ]
      };
    }
  );

  server.tool(
    "remove_note_from_notebook",
    "Remove a note from a notebook.",
    {
      notebookId: z.string().describe("Notebook ID"),
      noteId: z.string().describe("Note ID")
    },
    async ({ notebookId, noteId }) => {
      await db.relations.unlink(
        { id: notebookId, type: "notebook" },
        { id: noteId, type: "note" }
      );
      return {
        content: [
          {
            type: "text",
            text: `Note ${noteId} removed from notebook ${notebookId}.`
          }
        ]
      };
    }
  );
}
