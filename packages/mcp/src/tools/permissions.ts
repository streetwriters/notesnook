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
import { Database, Note } from "@notesnook/core";
import { z } from "zod";
import { Grant, Permission, PermissionStore } from "../permissions.js";

function errorContent(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

const PERMISSIONS = ["read", "write", "delete"] as const;

export function registerPermissionTools(
  server: McpServer,
  db: Database,
  store: PermissionStore
): void {
  server.tool(
    "list_permissions",
    "List all current access grants.",
    {},
    async () => {
      return {
        content: [{ type: "text", text: JSON.stringify(store.list(), null, 2) }]
      };
    }
  );

  server.tool(
    "revoke_access",
    "Revoke an access grant by its ID.",
    { grantId: z.string().describe("Grant ID to revoke") },
    async ({ grantId }) => {
      const removed = store.revoke(grantId);
      if (!removed) return errorContent(`Grant ${grantId} not found`);
      return { content: [{ type: "text", text: `Grant ${grantId} revoked.` }] };
    }
  );

  server.tool(
    "grant_access",
    "Grant the AI access to a notebook, tag, or note by name. " +
      "If a note name matches multiple notes, returns the candidates for disambiguation " +
      "instead of creating a grant.",
    {
      targetType: z
        .enum(["notebook", "tag", "note"])
        .describe("Type of entity to grant access to"),
      targetName: z
        .string()
        .describe("Name/title of the notebook, tag, or note"),
      permissions: z
        .array(z.enum(PERMISSIONS))
        .min(1)
        .describe("Permissions to grant: read, write, and/or delete")
    },
    async ({ targetType, targetName, permissions }) => {
      const perms = permissions as Permission[];

      if (targetType === "notebook") {
        const notebooks = await db.notebooks.all.items();
        const match = notebooks.find(
          (nb) => nb.title.toLowerCase() === targetName.toLowerCase()
        );
        if (!match)
          return errorContent(
            `No notebook named "${targetName}" found. Use list_notebooks to see available notebooks.`
          );
        const grant = store.grant("notebook", match.id, match.title, perms);
        return {
          content: [{ type: "text", text: JSON.stringify(grant, null, 2) }]
        };
      }

      if (targetType === "tag") {
        const tags = await db.tags.all.items();
        const match = tags.find(
          (t) => t.title.toLowerCase() === targetName.toLowerCase()
        );
        if (!match)
          return errorContent(
            `No tag named "${targetName}" found. Use list_tags to see available tags.`
          );
        const grant = store.grant("tag", match.id, match.title, perms);
        return {
          content: [{ type: "text", text: JSON.stringify(grant, null, 2) }]
        };
      }

      // targetType === "note" — fuzzy search, handle ambiguity
      const results = await db.lookup.notes(targetName).items(10);
      if (results.length === 0)
        return errorContent(`No note matching "${targetName}" found.`);

      if (results.length > 1) {
        // Return candidates so the user / AI can disambiguate
        const candidates = await Promise.all(
          results.map(async (note: Note) => {
            const notebooks = await db.relations
              .to({ id: note.id, type: "note" }, "notebook")
              .resolve();
            const tags = await db.relations
              .to({ id: note.id, type: "note" }, "tag")
              .resolve();
            return {
              id: note.id,
              title: note.title,
              dateModified: note.dateModified,
              notebooks: notebooks.map(
                (nb: { title?: string; id: string }) => nb.title ?? nb.id
              ),
              tags: tags.map(
                (t: { title?: string; id: string }) => t.title ?? t.id
              )
            };
          })
        );
        return {
          content: [
            {
              type: "text",
              text:
                `Multiple notes match "${targetName}". Please specify which note by ID using grant_access_by_id, or refine the name:\n\n` +
                JSON.stringify(candidates, null, 2)
            }
          ]
        };
      }

      const note = results[0];
      const grant: Grant = store.grant("note", note.id, note.title, perms);
      return {
        content: [{ type: "text", text: JSON.stringify(grant, null, 2) }]
      };
    }
  );

  server.tool(
    "grant_access_by_id",
    "Grant access to a specific note by its exact ID. Use this after grant_access returns multiple candidates.",
    {
      noteId: z.string().describe("Exact note ID"),
      permissions: z
        .array(z.enum(PERMISSIONS))
        .min(1)
        .describe("Permissions to grant")
    },
    async ({ noteId, permissions }) => {
      const note = await db.notes.note(noteId);
      if (!note) return errorContent(`Note ${noteId} not found`);
      const grant = store.grant(
        "note",
        note.id,
        note.title,
        permissions as Permission[]
      );
      return {
        content: [{ type: "text", text: JSON.stringify(grant, null, 2) }]
      };
    }
  );
}
