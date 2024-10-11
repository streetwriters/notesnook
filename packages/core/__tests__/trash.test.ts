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

import dayjs from "dayjs";
import {
  noteTest,
  notebookTest,
  TEST_NOTE,
  TEST_NOTEBOOK,
  databaseTest
} from "./utils/index.js";
import { test, expect } from "vitest";

test("trash should be empty", () =>
  databaseTest().then(async (db) => {
    expect(await db.trash.all()).toHaveLength(0);
  }));

test("permanently delete a note", () =>
  databaseTest().then(async (db) => {
    const noteId = await db.notes.add({
      ...TEST_NOTE,
      sessionId: Date.now().toString()
    });
    const note = await db.notes.note(noteId);
    if (!note) throw new Error("Could not find note.");

    expect(await db.noteHistory.get(noteId).count()).toBe(1);

    await db.notes.moveToTrash(noteId);

    expect(await db.trash.all()).toHaveLength(1);
    expect(await db.content.get(note?.contentId)).toBeDefined();
    await db.trash.delete(noteId);
    expect(await db.trash.all()).toHaveLength(0);
    expect(await db.content.get(note?.contentId)).toBeUndefined();

    expect(await db.noteHistory.get(noteId).count()).toBe(0);
  }));

test("restore a deleted note that was in a notebook", () =>
  noteTest().then(async ({ db, id }) => {
    const notebookId = await db.notebooks.add(TEST_NOTEBOOK);
    const subNotebookId = await db.notebooks.add({ title: "hello" });

    await db.relations.add(
      { type: "notebook", id: notebookId },
      { type: "notebook", id: subNotebookId }
    );
    await db.notes.addToNotebook(subNotebookId, id);

    await db.notes.moveToTrash(id);
    await db.trash.restore(id);
    expect(await db.trash.all()).toHaveLength(0);

    const note = await db.notes.note(id);
    const content = await db.content.get(note?.contentId);

    expect(note).toBeDefined();
    expect(content?.data).toBe(TEST_NOTE.content.data);

    expect(
      await db.relations
        .from({ type: "notebook", id: subNotebookId }, "note")
        .has(id)
    ).toBe(true);
  }));

test("delete a locked note", () =>
  noteTest().then(async ({ db, id }) => {
    const note = await db.notes.note(id);
    await db.vault.create("password");
    await db.vault.add(id);
    await db.notes.moveToTrash(id);
    expect(await db.trash.all()).toHaveLength(1);
    expect(await db.content.get(note?.contentId)).toBeDefined();
  }));

test("restore a deleted locked note", () =>
  noteTest().then(async ({ db, id }) => {
    let note = await db.notes.note(id);
    await db.vault.create("password");
    await db.vault.add(id);
    await db.notes.moveToTrash(id);
    expect(await db.trash.all()).toHaveLength(1);
    expect(await db.content.get(note?.contentId)).toBeDefined();
    await db.trash.restore(id);

    note = await db.notes.note(id);
    expect(await db.trash.all()).toHaveLength(0);
    expect(note).toBeDefined();
  }));

test("restore a deleted note that's in a deleted notebook", () =>
  noteTest().then(async ({ db, id }) => {
    const notebookId = await db.notebooks.add(TEST_NOTEBOOK);
    await db.notes.addToNotebook(notebookId, id);

    await db.notes.moveToTrash(id);
    await db.notebooks.moveToTrash(notebookId);

    await db.trash.restore(id);
    const note = await db.notes.note(id);
    expect(note).toBeDefined();
    expect(
      await db.relations.to({ type: "note", id }, "notebook").count()
    ).toBe(0);
  }));

test("delete a notebook", () =>
  notebookTest().then(async ({ db, id }) => {
    const noteId = await db.notes.add(TEST_NOTE);

    await db.notes.addToNotebook(id, noteId);

    await db.notebooks.moveToTrash(id);
    expect(await db.notebooks.notebook(id)).toBeUndefined();
    expect(
      await db.relations.to({ type: "note", id: noteId }, "notebook").count()
    ).toBe(0);
  }));

test("permanently delete items older than 7 days", () =>
  databaseTest().then(async (db) => {
    const sevenDaysEarlier = dayjs().subtract(8, "days").toDate().getTime();
    const noteId = await db.notes.add(TEST_NOTE);
    const notebookId = await db.notebooks.add(TEST_NOTEBOOK);

    await db.notebooks.moveToTrash(notebookId);
    await db.notes.moveToTrash(noteId);

    await db.notes.collection.update([noteId], {
      type: "trash",
      itemType: "note",
      id: noteId,
      dateDeleted: sevenDaysEarlier
    });

    await db.notebooks.collection.update([notebookId], {
      type: "trash",
      id: notebookId,
      dateDeleted: sevenDaysEarlier,
      itemType: "notebook"
    });

    expect(await db.trash.all()).toHaveLength(2);

    await db.trash.cleanup();

    expect(await db.trash.all()).toHaveLength(0);
  }));

test("trash cleanup should not delete items newer than 7 days", () =>
  databaseTest().then(async (db) => {
    const noteId = await db.notes.add(TEST_NOTE);
    const notebookId = await db.notebooks.add(TEST_NOTEBOOK);

    await db.notebooks.moveToTrash(notebookId);
    await db.notes.moveToTrash(noteId);

    expect(await db.trash.all()).toHaveLength(2);

    await db.trash.cleanup();

    expect(await db.trash.all()).toHaveLength(2);
  }));

test("clear trash should delete note content", () =>
  databaseTest().then(async (db) => {
    const noteId = await db.notes.add({
      ...TEST_NOTE,
      sessionId: Date.now().toString()
    });

    const notebookId = await db.notebooks.add(TEST_NOTEBOOK);

    expect(await db.noteHistory.get(noteId).count()).toBe(1);

    const note = { ...(await db.notes.note(noteId)) };

    await db.notebooks.moveToTrash(notebookId);
    await db.notes.moveToTrash(noteId);

    expect(await db.trash.all()).toHaveLength(2);

    await db.trash.clear();

    expect(await db.trash.all()).toHaveLength(0);

    const content = note.contentId && (await db.content.get(note.contentId));
    expect(content).toBeUndefined();

    expect(await db.noteHistory.get(noteId).count()).toBe(0);
  }));

test("deleting a notebook should delete all its subnotebooks", () =>
  databaseTest().then(async (db) => {
    const parent = await db.notebooks.add({ title: "Parent" });
    const child = await db.notebooks.add({ title: "Child" });
    await db.relations.add(
      { id: parent, type: "notebook" },
      { id: child, type: "notebook" }
    );

    await db.notebooks.moveToTrash(parent);

    expect(await db.notebooks.notebook(child)).toBeUndefined();
  }));

test("deleting a notebook should not re-delete already deleted subnotebooks", () =>
  databaseTest().then(async (db) => {
    const parent = await db.notebooks.add({ title: "Parent" });
    const child = await db.notebooks.add({ title: "Child" });
    const child2 = await db.notebooks.add({ title: "Child" });
    const child3 = await db.notebooks.add({ title: "Child" });
    await db.relations.add(
      { id: parent, type: "notebook" },
      { id: child, type: "notebook" }
    );
    await db.relations.add(
      { id: parent, type: "notebook" },
      { id: child2, type: "notebook" }
    );
    await db.relations.add(
      { id: parent, type: "notebook" },
      { id: child3, type: "notebook" }
    );

    await db.notebooks.moveToTrash(child3);
    await db.notebooks.moveToTrash(parent);

    const trash = await db.trash.all("user");
    expect(trash.some((a) => a.id === child3)).toBe(true);
    expect(trash.some((a) => a.id === parent)).toBe(true);
    expect(trash.some((a) => a.id === child2)).toBe(false);
    expect(trash.some((a) => a.id === child)).toBe(false);
  }));

test("restoring a deleted notebook should also restore all its subnotebooks", () =>
  databaseTest().then(async (db) => {
    const parent = await db.notebooks.add({ title: "Parent" });
    const child = await db.notebooks.add({ title: "Child" });
    await db.relations.add(
      { id: parent, type: "notebook" },
      { id: child, type: "notebook" }
    );
    await db.notebooks.moveToTrash(parent);

    await db.trash.restore(parent);

    expect(await db.notebooks.notebook(child)).toBeDefined();
    expect(
      await db.relations
        .from({ id: parent, type: "notebook" }, "notebook")
        .has(child)
    ).toBe(true);
  }));

test("restoring a deleted notebook should link it back to its notes", () =>
  notebookTest().then(async ({ db, id }) => {
    const noteId = await db.notes.add(TEST_NOTE);
    await db.notes.addToNotebook(id, noteId);

    await db.notebooks.moveToTrash(id);
    await db.trash.restore(id);

    const notebook = db.notebooks.notebook(id);
    expect(notebook).toBeDefined();

    expect(
      await db.relations.to({ type: "note", id: noteId }, "notebook").count()
    ).toBe(1);
    expect(
      await db.relations.to({ type: "note", id: noteId }, "notebook").has(id)
    ).toBe(true);
  }));

test("restoring a notebook should not restore its deleted notes", () =>
  notebookTest().then(async ({ db, id }) => {
    const noteId = await db.notes.add(TEST_NOTE);
    await db.notes.addToNotebook(id, noteId);

    await db.notebooks.moveToTrash(id);
    await db.notes.moveToTrash(noteId);
    await db.trash.restore(id);

    const notebook = db.notebooks.notebook(id);
    expect(notebook).toBeDefined();
    expect(
      await db.relations.from({ type: "notebook", id: id }, "note").has(noteId)
    ).toBe(false);
  }));

test("restoring a notebook should not restore independently deleted subnotebooks", () =>
  databaseTest().then(async (db) => {
    const parent = await db.notebooks.add({ title: "Parent" });
    const child = await db.notebooks.add({ title: "Child" });
    const child2 = await db.notebooks.add({ title: "Child" });
    const child3 = await db.notebooks.add({ title: "Child" });
    await db.relations.add(
      { id: parent, type: "notebook" },
      { id: child, type: "notebook" }
    );
    await db.relations.add(
      { id: parent, type: "notebook" },
      { id: child2, type: "notebook" }
    );
    await db.relations.add(
      { id: parent, type: "notebook" },
      { id: child3, type: "notebook" }
    );
    await db.notebooks.moveToTrash(child3);
    await db.notebooks.moveToTrash(parent);

    await db.trash.restore(parent);

    expect(await db.notebooks.notebook(child3)).toBeUndefined();
  }));

test("permanently deleting a notebook should not delete independently deleted subnotebooks", () =>
  databaseTest().then(async (db) => {
    const parent = await db.notebooks.add({ title: "Parent" });
    const child = await db.notebooks.add({ title: "Child" });
    const child2 = await db.notebooks.add({ title: "Child" });
    const child3 = await db.notebooks.add({ title: "Child" });
    await db.relations.add(
      { id: parent, type: "notebook" },
      { id: child, type: "notebook" }
    );
    await db.relations.add(
      { id: parent, type: "notebook" },
      { id: child2, type: "notebook" }
    );
    await db.relations.add(
      { id: parent, type: "notebook" },
      { id: child3, type: "notebook" }
    );
    await db.notebooks.moveToTrash(child3);
    await db.notebooks.moveToTrash(parent);

    await db.trash.delete(parent);

    const trash = await db.trash.all("user");
    expect(trash.some((a) => a.id === child3)).toBe(true);
    expect(trash.some((a) => a.id === parent)).toBe(false);
    expect(trash.some((a) => a.id === child2)).toBe(false);
    expect(trash.some((a) => a.id === child)).toBe(false);
  }));

test("permanently deleted note should not have note fields", () =>
  databaseTest().then(async (db) => {
    const noteId = await db.notes.add(TEST_NOTE);
    await db.notes.moveToTrash(noteId);

    await db.trash.delete(noteId);

    const rawItem = await db
      .sql()
      .selectFrom("notes")
      .selectAll()
      .where("id", "==", noteId)
      .executeTakeFirst();
    const keys = Object.keys(rawItem!);
    expect(keys.sort()).toStrictEqual([
      "dateModified",
      "deleted",
      "id",
      "synced"
    ]);
  }));
