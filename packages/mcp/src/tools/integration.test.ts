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

import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { rmSync } from "fs";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { Database } from "@notesnook/core";
import { makeTestServer, callTool } from "../test-utils.js";
import type { PermissionStore } from "../permissions.js";

let client: Client;
let db: Database;
let store: PermissionStore;
let dir: string;

beforeEach(async () => {
  ({ client, db, store, dir } = await makeTestServer());
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseJson(text: string) {
  return JSON.parse(text) as unknown;
}

// ─── Notes CRUD ──────────────────────────────────────────────────────────────

describe("Notes – create_note", () => {
  test("creates a note and returns its metadata", async () => {
    const { text, isError } = await callTool(client, "create_note", {
      title: "Hello MCP"
    });
    expect(isError).toBe(false);
    const note = parseJson(text) as { id: string; title: string };
    expect(note.title).toBe("Hello MCP");
    expect(typeof note.id).toBe("string");
  });

  test("creates a note with markdown content", async () => {
    const { text, isError } = await callTool(client, "create_note", {
      title: "Rich note",
      content: "# Heading\n\nParagraph text."
    });
    expect(isError).toBe(false);
    const note = parseJson(text) as { id: string };
    expect(typeof note.id).toBe("string");
  });
});

describe("Notes – get_note", () => {
  test("returns permission error when no grant exists", async () => {
    const noteId = await db.notes.add({ title: "Secret" });
    if (!noteId) throw new Error("Failed to create note");
    const { isError } = await callTool(client, "get_note", { id: noteId });
    expect(isError).toBe(true);
  });

  test("returns markdown content when read access is granted", async () => {
    const noteId = await db.notes.add({
      title: "My note",
      content: { type: "tiptap", data: "<p>Hello world</p>" }
    });
    if (!noteId) throw new Error("Failed to create note");
    store.grant("note", noteId, "My note", ["read"]);

    const { text, isError } = await callTool(client, "get_note", {
      id: noteId
    });
    expect(isError).toBe(false);
    expect(text).toContain("Hello world");
  });
});

describe("Notes – list_notes", () => {
  test("returns empty list when no grants exist", async () => {
    await db.notes.add({ title: "Hidden" });
    const { text, isError } = await callTool(client, "list_notes");
    expect(isError).toBe(false);
    expect(parseJson(text)).toEqual([]);
  });

  test("returns notes the AI has read access to", async () => {
    const id1 = await db.notes.add({ title: "Accessible" });
    const id2 = await db.notes.add({ title: "Inaccessible" });
    if (!id1 || !id2) throw new Error("Failed to create notes");
    store.grant("note", id1, "Accessible", ["read"]);

    const { text, isError } = await callTool(client, "list_notes");
    expect(isError).toBe(false);
    const notes = parseJson(text) as Array<{ id: string }>;
    expect(notes.some((n) => n.id === id1)).toBe(true);
    expect(notes.some((n) => n.id === id2)).toBe(false);
  });

  test("filters by notebookId when provided", async () => {
    const noteId = await db.notes.add({ title: "In notebook" });
    const otherId = await db.notes.add({ title: "Not in notebook" });
    const nbId = await db.notebooks.add({ title: "Test NB" });
    if (!noteId || !otherId || !nbId) throw new Error("Setup failed");

    await db.relations.add(
      { id: nbId, type: "notebook" },
      { id: noteId, type: "note" }
    );
    store.grant("notebook", nbId, "Test NB", ["read"]);

    const { text, isError } = await callTool(client, "list_notes", {
      notebookId: nbId
    });
    expect(isError).toBe(false);
    const notes = parseJson(text) as Array<{ id: string }>;
    expect(notes.some((n) => n.id === noteId)).toBe(true);
    expect(notes.some((n) => n.id === otherId)).toBe(false);
  });

  test("filters by tagId when provided", async () => {
    const noteId = await db.notes.add({ title: "Tagged note" });
    const otherId = await db.notes.add({ title: "Untagged note" });
    const tagId = await db.tags.add({ title: "work" });
    if (!noteId || !otherId || !tagId) throw new Error("Setup failed");

    await db.relations.add(
      { id: tagId, type: "tag" },
      { id: noteId, type: "note" }
    );
    store.grant("tag", tagId, "work", ["read"]);

    const { text, isError } = await callTool(client, "list_notes", {
      tagId
    });
    expect(isError).toBe(false);
    const notes = parseJson(text) as Array<{ id: string }>;
    expect(notes.some((n) => n.id === noteId)).toBe(true);
    expect(notes.some((n) => n.id === otherId)).toBe(false);
  });
});

describe("Notes – search_notes", () => {
  test("returns only accessible notes matching the query", async () => {
    const id1 = await db.notes.add({ title: "Quantum physics note" });
    const id2 = await db.notes.add({ title: "Quantum chemistry note" });
    if (!id1 || !id2) throw new Error("Failed to create notes");
    store.grant("note", id1, "Quantum physics note", ["read"]);
    // id2 has no grant → should be excluded

    const { text, isError } = await callTool(client, "search_notes", {
      query: "Quantum"
    });
    expect(isError).toBe(false);
    const notes = parseJson(text) as Array<{ id: string }>;
    expect(notes.some((n) => n.id === id1)).toBe(true);
    expect(notes.some((n) => n.id === id2)).toBe(false);
  });
});

describe("Notes – update_note", () => {
  test("updates title and content when write access is granted", async () => {
    const noteId = await db.notes.add({ title: "Old title" });
    if (!noteId) throw new Error("Failed to create note");
    store.grant("note", noteId, "Old title", ["read", "write"]);

    const { isError } = await callTool(client, "update_note", {
      id: noteId,
      title: "New title",
      content: "Updated body."
    });
    expect(isError).toBe(false);

    // Verify via get_note
    const { text } = await callTool(client, "get_note", { id: noteId });
    expect(text).toContain("Updated body");
  });

  test("returns permission error when write access is not granted", async () => {
    const noteId = await db.notes.add({ title: "Read-only grant" });
    if (!noteId) throw new Error("Failed to create note");
    store.grant("note", noteId, "Read-only grant", ["read"]);

    const { isError } = await callTool(client, "update_note", {
      id: noteId,
      title: "Hacked title"
    });
    expect(isError).toBe(true);
  });
});

describe("Notes – delete_note", () => {
  test("moves note to trash when delete access is granted", async () => {
    const noteId = await db.notes.add({ title: "To be trashed" });
    if (!noteId) throw new Error("Failed to create note");
    store.grant("note", noteId, "To be trashed", ["read", "delete"]);

    const { text, isError } = await callTool(client, "delete_note", {
      id: noteId
    });
    expect(isError).toBe(false);
    expect(text).toContain("trash");

    // Note should no longer appear in list_notes (trashed notes excluded from all)
    const listResult = await callTool(client, "list_notes");
    const notes = parseJson(listResult.text) as Array<{ id: string }>;
    expect(notes.some((n) => n.id === noteId)).toBe(false);
  });

  test("returns permission error when delete access is not granted", async () => {
    const noteId = await db.notes.add({ title: "Protected" });
    if (!noteId) throw new Error("Failed to create note");
    store.grant("note", noteId, "Protected", ["read", "write"]);

    const { isError } = await callTool(client, "delete_note", { id: noteId });
    expect(isError).toBe(true);
  });
});

// ─── Notebooks ────────────────────────────────────────────────────────────────

describe("Notebooks – CRUD", () => {
  test("create_notebook returns the new notebook", async () => {
    const { text, isError } = await callTool(client, "create_notebook", {
      title: "My Notebook",
      description: "Test notebook"
    });
    expect(isError).toBe(false);
    const nb = parseJson(text) as { id: string; title: string };
    expect(nb.title).toBe("My Notebook");
    expect(typeof nb.id).toBe("string");
  });

  test("list_notebooks includes newly created notebook", async () => {
    const id = await db.notebooks.add({ title: "Exists" });
    if (!id) throw new Error("Failed to create notebook");

    const { text, isError } = await callTool(client, "list_notebooks");
    expect(isError).toBe(false);
    const notebooks = parseJson(text) as Array<{ id: string }>;
    expect(notebooks.some((nb) => nb.id === id)).toBe(true);
  });

  test("delete_notebook removes it from list_notebooks", async () => {
    const id = await db.notebooks.add({ title: "To delete" });
    if (!id) throw new Error("Failed to create notebook");

    await callTool(client, "delete_notebook", { id });

    const { text } = await callTool(client, "list_notebooks");
    const notebooks = parseJson(text) as Array<{ id: string }>;
    expect(notebooks.some((nb) => nb.id === id)).toBe(false);
  });

  test("add_note_to_notebook → note appears in list_notes filtered by notebook", async () => {
    const noteId = await db.notes.add({ title: "Notebook note" });
    const nbId = await db.notebooks.add({ title: "Container" });
    if (!noteId || !nbId) throw new Error("Setup failed");
    store.grant("notebook", nbId, "Container", ["read"]);

    await callTool(client, "add_note_to_notebook", {
      notebookId: nbId,
      noteId
    });

    const { text } = await callTool(client, "list_notes", { notebookId: nbId });
    const notes = parseJson(text) as Array<{ id: string }>;
    expect(notes.some((n) => n.id === noteId)).toBe(true);
  });

  test("remove_note_from_notebook → note no longer in notebook list", async () => {
    const noteId = await db.notes.add({ title: "Notebook note" });
    const nbId = await db.notebooks.add({ title: "Container" });
    if (!noteId || !nbId) throw new Error("Setup failed");
    await db.relations.add(
      { id: nbId, type: "notebook" },
      { id: noteId, type: "note" }
    );
    store.grant("notebook", nbId, "Container", ["read"]);

    await callTool(client, "remove_note_from_notebook", {
      notebookId: nbId,
      noteId
    });

    const { text } = await callTool(client, "list_notes", { notebookId: nbId });
    const notes = parseJson(text) as Array<{ id: string }>;
    expect(notes.some((n) => n.id === noteId)).toBe(false);
  });
});

// ─── Tags ─────────────────────────────────────────────────────────────────────

describe("Tags – CRUD", () => {
  test("create_tag returns the new tag", async () => {
    const { text, isError } = await callTool(client, "create_tag", {
      title: "my-tag"
    });
    expect(isError).toBe(false);
    const tag = parseJson(text) as { id: string; title: string };
    expect(tag.title).toBe("my-tag");
    expect(typeof tag.id).toBe("string");
  });

  test("list_tags includes newly created tag", async () => {
    const id = await db.tags.add({ title: "existing-tag" });
    if (!id) throw new Error("Failed to create tag");

    const { text, isError } = await callTool(client, "list_tags");
    expect(isError).toBe(false);
    const tags = parseJson(text) as Array<{ id: string }>;
    expect(tags.some((t) => t.id === id)).toBe(true);
  });

  test("tag_note applies tag when write access is granted", async () => {
    const noteId = await db.notes.add({ title: "Note to tag" });
    const tagId = await db.tags.add({ title: "important" });
    if (!noteId || !tagId) throw new Error("Setup failed");
    store.grant("note", noteId, "Note to tag", ["read", "write"]);

    const { isError } = await callTool(client, "tag_note", { tagId, noteId });
    expect(isError).toBe(false);

    // Verify note appears in tag-filtered list
    store.grant("tag", tagId, "important", ["read"]);
    const { text } = await callTool(client, "list_notes", { tagId });
    const notes = parseJson(text) as Array<{ id: string }>;
    expect(notes.some((n) => n.id === noteId)).toBe(true);
  });

  test("tag_note returns permission error without write access", async () => {
    const noteId = await db.notes.add({ title: "Read-only note" });
    const tagId = await db.tags.add({ title: "tag" });
    if (!noteId || !tagId) throw new Error("Setup failed");
    store.grant("note", noteId, "Read-only note", ["read"]);

    const { isError } = await callTool(client, "tag_note", { tagId, noteId });
    expect(isError).toBe(true);
  });

  test("untag_note removes tag association", async () => {
    const noteId = await db.notes.add({ title: "Tagged note" });
    const tagId = await db.tags.add({ title: "removable" });
    if (!noteId || !tagId) throw new Error("Setup failed");
    await db.relations.add(
      { id: tagId, type: "tag" },
      { id: noteId, type: "note" }
    );
    // Only grant note access (with write). Do NOT grant tag access yet —
    // if the tag grant (["read"]-only) were active now, checkAccess for
    // "write" would find both grants, intersect them, and deny write
    // (least-permissive wins), preventing the unlink.
    store.grant("note", noteId, "Tagged note", ["read", "write"]);

    await callTool(client, "untag_note", { tagId, noteId });

    // After unlink the tag→note relation is gone, so list_notes({tagId})
    // returns no notes regardless of grants.
    const { text } = await callTool(client, "list_notes", { tagId });
    const notes = parseJson(text) as Array<{ id: string }>;
    expect(notes.some((n) => n.id === noteId)).toBe(false);
  });
});

// ─── Reminders ───────────────────────────────────────────────────────────────

describe("Reminders – CRUD", () => {
  const futureDate = Date.now() + 86_400_000; // tomorrow

  test("create_reminder returns the new reminder", async () => {
    const { text, isError } = await callTool(client, "create_reminder", {
      title: "Review notes",
      date: futureDate
    });
    expect(isError).toBe(false);
    const reminder = parseJson(text) as { id: string; title: string };
    expect(reminder.title).toBe("Review notes");
    expect(typeof reminder.id).toBe("string");
  });

  test("list_reminders includes newly created reminder", async () => {
    const id = await db.reminders.add({
      title: "Stand-up",
      date: futureDate,
      mode: "once",
      priority: "vibrate"
    });
    if (!id) throw new Error("Failed to create reminder");

    const { text, isError } = await callTool(client, "list_reminders");
    expect(isError).toBe(false);
    const reminders = parseJson(text) as Array<{ id: string }>;
    expect(reminders.some((r) => r.id === id)).toBe(true);
  });

  test("update_reminder changes the title", async () => {
    const id = await db.reminders.add({
      title: "Old title",
      date: futureDate,
      mode: "once",
      priority: "vibrate"
    });
    if (!id) throw new Error("Failed to create reminder");

    const { isError } = await callTool(client, "update_reminder", {
      id,
      title: "New title"
    });
    expect(isError).toBe(false);

    const { text } = await callTool(client, "list_reminders");
    const reminders = parseJson(text) as Array<{ id: string; title: string }>;
    const updated = reminders.find((r) => r.id === id);
    expect(updated?.title).toBe("New title");
  });

  test("delete_reminder removes it from list_reminders", async () => {
    const id = await db.reminders.add({
      title: "To delete",
      date: futureDate,
      mode: "once",
      priority: "vibrate"
    });
    if (!id) throw new Error("Failed to create reminder");

    await callTool(client, "delete_reminder", { id });

    const { text } = await callTool(client, "list_reminders");
    const reminders = parseJson(text) as Array<{ id: string }>;
    expect(reminders.some((r) => r.id === id)).toBe(false);
  });
});

// ─── Permissions ─────────────────────────────────────────────────────────────

describe("Permissions – grant_access / revoke_access / list_permissions", () => {
  test("list_permissions returns empty when no grants exist", async () => {
    const { text, isError } = await callTool(client, "list_permissions");
    expect(isError).toBe(false);
    expect(parseJson(text)).toEqual([]);
  });

  test("grant_access for a notebook resolves by name and creates a grant", async () => {
    await db.notebooks.add({ title: "My Notebook" });

    const { text, isError } = await callTool(client, "grant_access", {
      targetType: "notebook",
      targetName: "My Notebook",
      permissions: ["read"]
    });
    expect(isError).toBe(false);
    const grant = parseJson(text) as { targetType: string; targetName: string };
    expect(grant.targetType).toBe("notebook");
    expect(grant.targetName).toBe("My Notebook");

    // Should appear in list_permissions
    const listResult = await callTool(client, "list_permissions");
    const grants = parseJson(listResult.text) as Array<{ targetName: string }>;
    expect(grants.some((g) => g.targetName === "My Notebook")).toBe(true);
  });

  test("grant_access returns error for unknown notebook name", async () => {
    const { isError } = await callTool(client, "grant_access", {
      targetType: "notebook",
      targetName: "Nonexistent Notebook",
      permissions: ["read"]
    });
    expect(isError).toBe(true);
  });

  test("grant_access for a tag resolves by name and creates a grant", async () => {
    await db.tags.add({ title: "work" });

    const { text, isError } = await callTool(client, "grant_access", {
      targetType: "tag",
      targetName: "work",
      permissions: ["read", "write"]
    });
    expect(isError).toBe(false);
    const grant = parseJson(text) as {
      targetType: string;
      permissions: string[];
    };
    expect(grant.targetType).toBe("tag");
    expect(grant.permissions).toContain("read");
    expect(grant.permissions).toContain("write");
  });

  test("grant_access for a unique note title creates a grant", async () => {
    await db.notes.add({ title: "Unique Note Title XYZ" });

    const { text, isError } = await callTool(client, "grant_access", {
      targetType: "note",
      targetName: "Unique Note Title XYZ",
      permissions: ["read"]
    });
    expect(isError).toBe(false);
    const grant = parseJson(text) as { targetType: string };
    expect(grant.targetType).toBe("note");
  });

  test("revoke_access removes the grant", async () => {
    const nbId = await db.notebooks.add({ title: "Revokable NB" });
    if (!nbId) throw new Error("Failed to create notebook");
    const grantObj = store.grant("notebook", nbId, "Revokable NB", ["read"]);

    const { text, isError } = await callTool(client, "revoke_access", {
      grantId: grantObj.id
    });
    expect(isError).toBe(false);
    expect(text).toContain("revoked");

    const listResult = await callTool(client, "list_permissions");
    const grants = parseJson(listResult.text) as Array<{ id: string }>;
    expect(grants.some((g) => g.id === grantObj.id)).toBe(false);
  });

  test("revoke_access returns error for unknown grant ID", async () => {
    const { isError } = await callTool(client, "revoke_access", {
      grantId: "nonexistent-id"
    });
    expect(isError).toBe(true);
  });

  test("grant_access_by_id grants access to a note by exact ID", async () => {
    const noteId = await db.notes.add({ title: "Exact ID note" });
    if (!noteId) throw new Error("Failed to create note");

    const { text, isError } = await callTool(client, "grant_access_by_id", {
      noteId,
      permissions: ["read"]
    });
    expect(isError).toBe(false);
    const grant = parseJson(text) as { targetType: string; targetId: string };
    expect(grant.targetType).toBe("note");
    expect(grant.targetId).toBe(noteId);
  });
});
