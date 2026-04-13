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

export function registerTagTools(
  server: McpServer,
  db: Database,
  store: PermissionStore
): void {
  server.tool(
    "list_tags",
    "List all tags. Tag list is always visible so the AI can request access grants.",
    {},
    async () => {
      const tags = await db.tags.all.items();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              tags.map((t) => ({ id: t.id, title: t.title })),
              null,
              2
            )
          }
        ]
      };
    }
  );

  server.tool(
    "create_tag",
    "Create a new tag.",
    { title: z.string().describe("Tag title") },
    async ({ title }) => {
      const id = await db.tags.add({ title });
      if (!id) return errorContent("Failed to create tag");
      const tag = await db.tags.tag(id);
      return {
        content: [
          { type: "text", text: JSON.stringify(tag ?? { id }, null, 2) }
        ]
      };
    }
  );

  server.tool(
    "tag_note",
    "Apply a tag to a note. Requires write access on the note.",
    {
      tagId: z.string().describe("Tag ID"),
      noteId: z.string().describe("Note ID")
    },
    async ({ tagId, noteId }) => {
      const allowed = await store.checkAccess(db, noteId, "write");
      if (!allowed)
        return errorContent(
          `Permission denied: no write access for note ${noteId}`
        );

      await db.relations.add(
        { id: tagId, type: "tag" },
        { id: noteId, type: "note" }
      );
      return {
        content: [
          { type: "text", text: `Tag ${tagId} applied to note ${noteId}.` }
        ]
      };
    }
  );

  server.tool(
    "untag_note",
    "Remove a tag from a note. Requires write access on the note.",
    {
      tagId: z.string().describe("Tag ID"),
      noteId: z.string().describe("Note ID")
    },
    async ({ tagId, noteId }) => {
      const allowed = await store.checkAccess(db, noteId, "write");
      if (!allowed)
        return errorContent(
          `Permission denied: no write access for note ${noteId}`
        );

      await db.relations.unlink(
        { id: tagId, type: "tag" },
        { id: noteId, type: "note" }
      );
      return {
        content: [
          { type: "text", text: `Tag ${tagId} removed from note ${noteId}.` }
        ]
      };
    }
  );
}
