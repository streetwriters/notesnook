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
import { makeTestDb, makeTestStore } from "./test-utils.js";
import { PermissionStore, withPermissionCheck } from "./permissions.js";
import type { Database } from "@notesnook/core";

let dir: string;
let db: Database;
let store: PermissionStore;

beforeEach(async () => {
  ({ db, dir } = await makeTestDb());
  store = makeTestStore(dir);
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("PermissionStore – grant / revoke / list", () => {
  test("starts with empty grants list", () => {
    expect(store.list()).toEqual([]);
  });

  test("grant creates a new entry", () => {
    const g = store.grant("note", "note-1", "My Note", ["read"]);
    expect(g.targetType).toBe("note");
    expect(g.targetId).toBe("note-1");
    expect(g.targetName).toBe("My Note");
    expect(g.permissions).toEqual(["read"]);
    expect(typeof g.id).toBe("string");
    expect(g.createdAt).toBeGreaterThan(0);
  });

  test("grant updates permissions when target already exists", () => {
    const g1 = store.grant("note", "note-1", "My Note", ["read"]);
    const g2 = store.grant("note", "note-1", "My Note (renamed)", [
      "read",
      "write"
    ]);
    expect(g1.id).toBe(g2.id);
    expect(store.list()).toHaveLength(1);
    expect(g2.permissions).toEqual(["read", "write"]);
    expect(g2.targetName).toBe("My Note (renamed)");
  });

  test("revoke removes a grant by id", () => {
    const g = store.grant("note", "note-1", "Note", ["read"]);
    const removed = store.revoke(g.id);
    expect(removed).toBe(true);
    expect(store.list()).toHaveLength(0);
  });

  test("revoke returns false for unknown id", () => {
    expect(store.revoke("nonexistent-id")).toBe(false);
  });

  test("list returns a copy of grants", () => {
    store.grant("note", "note-1", "Note 1", ["read"]);
    store.grant("notebook", "nb-1", "Notebook 1", ["read", "write"]);
    const list = store.list();
    expect(list).toHaveLength(2);
    // Mutating the returned array should not affect the store
    list.pop();
    expect(store.list()).toHaveLength(2);
  });

  test("grants persist to disk and reload on construction", () => {
    store.grant("tag", "tag-1", "Work", ["read"]);
    const store2 = makeTestStore(dir);
    expect(store2.list()).toHaveLength(1);
    expect(store2.list()[0].targetId).toBe("tag-1");
  });
});

describe("PermissionStore – checkAccess with note grants", () => {
  test("denies access when no grants exist", async () => {
    const allowed = await store.checkAccess(db, "note-1", "read");
    expect(allowed).toBe(false);
  });

  test("allows read when a direct note grant includes read", async () => {
    const noteId = await db.notes.add({ title: "Test note" });
    if (!noteId) throw new Error("Failed to create note");
    store.grant("note", noteId, "Test note", ["read"]);
    expect(await store.checkAccess(db, noteId, "read")).toBe(true);
  });

  test("denies write when grant only has read", async () => {
    const noteId = await db.notes.add({ title: "Test note" });
    if (!noteId) throw new Error("Failed to create note");
    store.grant("note", noteId, "Test note", ["read"]);
    expect(await store.checkAccess(db, noteId, "write")).toBe(false);
  });

  test("allows write when grant includes write", async () => {
    const noteId = await db.notes.add({ title: "Test note" });
    if (!noteId) throw new Error("Failed to create note");
    store.grant("note", noteId, "Test note", ["read", "write"]);
    expect(await store.checkAccess(db, noteId, "write")).toBe(true);
  });

  test("denies access when note not covered by any grant", async () => {
    const noteId = await db.notes.add({ title: "Test note" });
    if (!noteId) throw new Error("Failed to create note");
    store.grant("note", "other-note-id", "Other note", ["read"]);
    expect(await store.checkAccess(db, noteId, "read")).toBe(false);
  });
});

describe("PermissionStore – checkAccess with notebook grants", () => {
  test("allows read for note in a granted notebook", async () => {
    const noteId = await db.notes.add({ title: "Notebook note" });
    if (!noteId) throw new Error("Failed to create note");
    const nbId = await db.notebooks.add({ title: "My Notebook" });
    if (!nbId) throw new Error("Failed to create notebook");
    await db.relations.add(
      { id: nbId, type: "notebook" },
      { id: noteId, type: "note" }
    );
    store.grant("notebook", nbId, "My Notebook", ["read"]);
    expect(await store.checkAccess(db, noteId, "read")).toBe(true);
  });

  test("denies read for note NOT in a granted notebook", async () => {
    const noteId = await db.notes.add({ title: "Orphan note" });
    if (!noteId) throw new Error("Failed to create note");
    const nbId = await db.notebooks.add({ title: "My Notebook" });
    if (!nbId) throw new Error("Failed to create notebook");
    store.grant("notebook", nbId, "My Notebook", ["read"]);
    expect(await store.checkAccess(db, noteId, "read")).toBe(false);
  });
});

describe("PermissionStore – checkAccess with tag grants", () => {
  test("allows read for note with a granted tag", async () => {
    const noteId = await db.notes.add({ title: "Tagged note" });
    if (!noteId) throw new Error("Failed to create note");
    const tagId = await db.tags.add({ title: "work" });
    if (!tagId) throw new Error("Failed to create tag");
    await db.relations.add(
      { id: tagId, type: "tag" },
      { id: noteId, type: "note" }
    );
    store.grant("tag", tagId, "work", ["read"]);
    expect(await store.checkAccess(db, noteId, "read")).toBe(true);
  });

  test("denies read for note without the granted tag", async () => {
    const noteId = await db.notes.add({ title: "Untagged note" });
    if (!noteId) throw new Error("Failed to create note");
    const tagId = await db.tags.add({ title: "work" });
    if (!tagId) throw new Error("Failed to create tag");
    store.grant("tag", tagId, "work", ["read"]);
    expect(await store.checkAccess(db, noteId, "read")).toBe(false);
  });
});

describe("PermissionStore – least-permissive-wins", () => {
  test("denies write when one of two matching grants lacks write", async () => {
    const noteId = await db.notes.add({ title: "Multi-grant note" });
    if (!noteId) throw new Error("Failed to create note");
    const nbId = await db.notebooks.add({ title: "Notebook" });
    if (!nbId) throw new Error("Failed to create notebook");
    await db.relations.add(
      { id: nbId, type: "notebook" },
      { id: noteId, type: "note" }
    );
    // Note grant allows read+write; notebook grant only allows read
    store.grant("note", noteId, "Multi-grant note", ["read", "write"]);
    store.grant("notebook", nbId, "Notebook", ["read"]);
    expect(await store.checkAccess(db, noteId, "write")).toBe(false);
  });
});

describe("withPermissionCheck", () => {
  test("calls fn when access is allowed", async () => {
    const noteId = await db.notes.add({ title: "Allowed note" });
    if (!noteId) throw new Error("Failed to create note");
    store.grant("note", noteId, "Allowed note", ["read"]);
    const result = await withPermissionCheck(db, store, noteId, "read", () =>
      Promise.resolve("success")
    );
    expect(result).toBe("success");
  });

  test("returns error object when access is denied", async () => {
    const result = await withPermissionCheck(
      db,
      store,
      "no-such-note",
      "read",
      () => Promise.resolve("success")
    );
    expect(result).toMatchObject({ error: expect.stringContaining("denied") });
  });
});
