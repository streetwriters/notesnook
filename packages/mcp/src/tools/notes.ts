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
import showdown from "@streetwriters/showdown";
import { z } from "zod";
import { PermissionStore } from "../permissions.js";

// Reuse the same showdown configuration that @notesnook/core uses internally
// for its tiptap content-type (packages/core/src/content-types/tiptap.ts).
const converter = new showdown.Converter();
converter.setFlavor("original");

function noteMetadata(note: Note) {
  return {
    id: note.id,
    title: note.title,
    dateModified: note.dateModified,
    favorite: note.favorite,
    pinned: note.pinned,
    archived: note.archived ?? false,
    readonly: note.readonly ?? false
  };
}

function errorContent(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

export function registerNoteTools(
  server: McpServer,
  db: Database,
  store: PermissionStore
): void {
  // ── list_notes ────────────────────────────────────────────────────────────
  server.tool(
    "list_notes",
    "List notes the AI has been granted access to. Optionally filter by notebook ID, tag ID, favorite, pinned, or archived status.",
    {
      notebookId: z.string().optional().describe("Filter by notebook ID"),
      tagId: z.string().optional().describe("Filter by tag ID"),
      favorite: z.boolean().optional().describe("Filter to favorite notes"),
      pinned: z.boolean().optional().describe("Filter to pinned notes")
    },
    async ({ notebookId, tagId, favorite, pinned }) => {
      let notes: Note[];

      if (notebookId) {
        const relations = await db.relations
          .from({ id: notebookId, type: "notebook" }, "note")
          .resolve();
        notes = relations as Note[];
      } else if (tagId) {
        const relations = await db.relations
          .from({ id: tagId, type: "tag" }, "note")
          .resolve();
        notes = relations as Note[];
      } else if (favorite) {
        notes = await db.notes.favorites.items();
      } else if (pinned) {
        notes = await db.notes.pinned.items();
      } else {
        notes = await db.notes.all.items();
      }

      const accessible: ReturnType<typeof noteMetadata>[] = [];
      for (const note of notes) {
        if (await store.checkAccess(db, note.id, "read")) {
          accessible.push(noteMetadata(note));
        }
      }

      return {
        content: [{ type: "text", text: JSON.stringify(accessible, null, 2) }]
      };
    }
  );

  // ── search_notes ──────────────────────────────────────────────────────────
  server.tool(
    "search_notes",
    "Search notes by keyword. Returns only notes the AI has read access to.",
    {
      query: z.string().describe("Search query"),
      limit: z.number().int().min(1).max(100).optional().default(20)
    },
    async ({ query, limit }) => {
      const results = await db.lookup.notes(query).items(limit);
      const accessible: ReturnType<typeof noteMetadata>[] = [];
      for (const note of results) {
        if (await store.checkAccess(db, note.id, "read")) {
          accessible.push(noteMetadata(note));
        }
      }
      return {
        content: [{ type: "text", text: JSON.stringify(accessible, null, 2) }]
      };
    }
  );

  // ── get_note ──────────────────────────────────────────────────────────────
  server.tool(
    "get_note",
    "Get the full content of a note as Markdown. The note must have been granted read access.",
    { id: z.string().describe("Note ID") },
    async ({ id }) => {
      const allowed = await store.checkAccess(db, id, "read");
      if (!allowed)
        return errorContent(`Permission denied: no read access for note ${id}`);

      const note = await db.notes.note(id);
      if (!note) return errorContent(`Note ${id} not found`);

      const content = await db.notes.export(note, { format: "md" });
      if (content === false) return errorContent(`Failed to export note ${id}`);

      return { content: [{ type: "text", text: content }] };
    }
  );

  // ── create_note ───────────────────────────────────────────────────────────
  server.tool(
    "create_note",
    "Create a new note. Optionally add it to a notebook (requires write access on that notebook grant) and apply tags.",
    {
      title: z.string().describe("Note title"),
      content: z.string().optional().describe("Note body in Markdown"),
      notebookId: z
        .string()
        .optional()
        .describe("Notebook ID to add the note to"),
      tagIds: z.array(z.string()).optional().describe("Tag IDs to apply")
    },
    async ({ title, content, notebookId, tagIds }) => {
      // If targeting a notebook, verify write access exists for that notebook grant
      if (notebookId) {
        const grants = store
          .list()
          .filter(
            (g) => g.targetType === "notebook" && g.targetId === notebookId
          );
        if (
          grants.length === 0 ||
          !grants.some((g) => g.permissions.includes("write"))
        ) {
          return errorContent(
            `Permission denied: no write grant for notebook ${notebookId}`
          );
        }
      }

      const noteId = await db.notes.add({
        title,
        content: content
          ? { type: "tiptap" as const, data: mdToTiptap(content) }
          : undefined
      });
      if (!noteId) return errorContent("Failed to create note");

      if (notebookId) {
        await db.relations.add(
          { id: notebookId, type: "notebook" },
          { id: noteId, type: "note" }
        );
      }

      if (tagIds?.length) {
        for (const tagId of tagIds) {
          await db.relations.add(
            { id: tagId, type: "tag" },
            { id: noteId, type: "note" }
          );
        }
      }

      const note = await db.notes.note(noteId);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              note ? noteMetadata(note) : { id: noteId },
              null,
              2
            )
          }
        ]
      };
    }
  );

  // ── update_note ───────────────────────────────────────────────────────────
  server.tool(
    "update_note",
    "Update the title and/or content of an existing note. Requires write access.",
    {
      id: z.string().describe("Note ID"),
      title: z.string().optional().describe("New title"),
      content: z.string().optional().describe("New body in Markdown")
    },
    async ({ id, title, content }) => {
      const allowed = await store.checkAccess(db, id, "write");
      if (!allowed)
        return errorContent(
          `Permission denied: no write access for note ${id}`
        );

      await db.notes.add({
        id,
        ...(title !== undefined ? { title } : {}),
        ...(content !== undefined
          ? { content: { type: "tiptap" as const, data: mdToTiptap(content) } }
          : {})
      });

      const note = await db.notes.note(id);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(note ? noteMetadata(note) : { id }, null, 2)
          }
        ]
      };
    }
  );

  // ── delete_note ───────────────────────────────────────────────────────────
  server.tool(
    "delete_note",
    "Move a note to trash. Requires delete access.",
    { id: z.string().describe("Note ID") },
    async ({ id }) => {
      const allowed = await store.checkAccess(db, id, "delete");
      if (!allowed)
        return errorContent(
          `Permission denied: no delete access for note ${id}`
        );

      await db.notes.moveToTrash(id);
      return {
        content: [{ type: "text", text: `Note ${id} moved to trash.` }]
      };
    }
  );
}

/**
 * Convert Markdown to tiptap's internal HTML format.
 * Uses the same @streetwriters/showdown instance that @notesnook/core uses,
 * so the output is consistent with how notes are stored by the official apps.
 * Also normalises literal "\n" escape sequences that arrive from LLM tool calls.
 */
function mdToTiptap(md: string): string {
  const normalized = md.replace(/\\n/g, "\n");
  return converter.makeHtml(normalized);
}
