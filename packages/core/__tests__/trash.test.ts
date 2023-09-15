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
} from "./utils";
import { test, expect } from "vitest";

test("trash should be empty", () =>
  databaseTest().then((db) => {
    expect(db.trash.all).toHaveLength(0);
  }));

test("permanently delete a note", () =>
  databaseTest().then(async (db) => {
    const noteId = await db.notes.add({
      ...TEST_NOTE,
      sessionId: Date.now().toString()
    });
    const note = db.notes.note(noteId);
    if (!note) throw new Error("Could not find note.");

    let sessions = await db.noteHistory.get(noteId);
    expect(sessions).toHaveLength(1);

    await db.notes.delete(noteId);
    expect(db.trash.all).toHaveLength(1);
    expect(await note.content()).toBeDefined();
    await db.trash.delete(db.trash.all[0].id);
    expect(db.trash.all).toHaveLength(0);
    const content = note.contentId && (await db.content.get(note.contentId));
    expect(content).toBeUndefined();

    sessions = await db.noteHistory.get(noteId);
    expect(sessions).toHaveLength(0);
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

    await db.notes.delete(id);
    await db.trash.restore(db.trash.all[0].id);
    expect(db.trash.all).toHaveLength(0);

    const note = db.notes.note(id);

    expect(note).toBeDefined();
    expect(await note?.content()).toBe(TEST_NOTE.content.data);

    expect(
      db.relations.from({ type: "notebook", id: subNotebookId }, "note").has(id)
    ).toBe(true);
  }));

test("delete a locked note", () =>
  noteTest().then(async ({ db, id }) => {
    const note = db.notes.note(id);
    await db.vault.create("password");
    await db.vault.add(id);
    await db.notes.delete(id);
    expect(db.trash.all).toHaveLength(1);
    expect(
      note && note.contentId && (await db.content.get(note.contentId))
    ).toBeDefined();
  }));

test("restore a deleted locked note", () =>
  noteTest().then(async ({ db, id }) => {
    let note = db.notes.note(id);
    await db.vault.create("password");
    await db.vault.add(id);
    await db.notes.delete(id);
    expect(db.trash.all).toHaveLength(1);
    expect(
      note && note.contentId && (await db.content.get(note.contentId))
    ).toBeDefined();
    await db.trash.restore(db.trash.all[0].id);
    expect(db.trash.all).toHaveLength(0);
    note = db.notes.note(id);
    expect(note).toBeDefined();
  }));

test("restore a deleted note that's in a deleted notebook", () =>
  noteTest().then(async ({ db, id }) => {
    const notebookId = await db.notebooks.add(TEST_NOTEBOOK);
    await db.notes.addToNotebook(notebookId, id);

    await db.notes.delete(id);
    await db.notebooks.delete(notebookId);

    await db.trash.restore(id);
    const note = db.notes.note(id);
    expect(note).toBeDefined();
    expect(db.relations.to({ type: "note", id }, "notebook")).toHaveLength(0);
  }));

test("delete a notebook", () =>
  notebookTest().then(async ({ db, id }) => {
    const noteId = await db.notes.add(TEST_NOTE);

    await db.notes.addToNotebook(id, noteId);

    await db.notebooks.delete(id);
    expect(db.notebooks.notebook(id)).toBeUndefined();
    expect(
      db.relations.to({ type: "note", id: noteId }, "notebook")
    ).toHaveLength(0);
  }));

test("restore a deleted notebook", () =>
  notebookTest().then(async ({ db, id }) => {
    const noteId = await db.notes.add(TEST_NOTE);
    await db.notes.addToNotebook(id, noteId);

    await db.notebooks.delete(id);
    await db.trash.restore(id);

    const notebook = db.notebooks.notebook(id);
    expect(notebook).toBeDefined();

    expect(
      db.relations.to({ type: "note", id: noteId }, "notebook")
    ).toHaveLength(1);
    expect(
      db.relations.to({ type: "note", id: noteId }, "notebook").has(id)
    ).toBe(true);
  }));

test("restore a notebook that has deleted notes", () =>
  notebookTest().then(async ({ db, id }) => {
    const noteId = await db.notes.add(TEST_NOTE);
    await db.notes.addToNotebook(id, noteId);

    await db.notebooks.delete(id);
    await db.notes.delete(noteId);
    await db.trash.restore(id);

    const notebook = db.notebooks.notebook(id);
    expect(notebook).toBeDefined();
    expect(
      db.relations.from({ type: "notebook", id: id }, "note").has(noteId)
    ).toBe(false);
  }));

test("permanently delete items older than 7 days", () =>
  databaseTest().then(async (db) => {
    const sevenDaysEarlier = dayjs().subtract(8, "days").toDate().getTime();
    const noteId = await db.notes.add(TEST_NOTE);
    const notebookId = await db.notebooks.add(TEST_NOTEBOOK);

    await db.notebooks.delete(notebookId);
    await db.notes.delete(noteId);

    const note = db.trash.all.find((t) => t.id === noteId);
    if (!note || note.itemType !== "note")
      throw new Error("Could not find note in trash.");

    await db.notes.collection.update({
      ...note,
      type: "trash",
      id: noteId,
      dateDeleted: sevenDaysEarlier
    });

    const notebook = db.trash.all.find((t) => t.id === notebookId);
    if (!notebook || notebook.itemType !== "notebook")
      throw new Error("Could not find notebook in trash.");

    await db.notebooks.collection.update({
      ...notebook,
      type: "trash",
      id: notebookId,
      dateDeleted: sevenDaysEarlier,
      itemType: "notebook"
    });

    expect(db.trash.all).toHaveLength(2);

    await db.trash.cleanup();

    expect(db.trash.all).toHaveLength(0);
  }));

test("trash cleanup should not delete items newer than 7 days", () =>
  databaseTest().then(async (db) => {
    const noteId = await db.notes.add(TEST_NOTE);
    const notebookId = await db.notebooks.add(TEST_NOTEBOOK);

    await db.notebooks.delete(notebookId);
    await db.notes.delete(noteId);

    expect(db.trash.all).toHaveLength(2);

    await db.trash.cleanup();

    expect(db.trash.all).toHaveLength(2);
  }));

test("clear trash should delete note content", () =>
  databaseTest().then(async (db) => {
    const noteId = await db.notes.add({
      ...TEST_NOTE,
      sessionId: Date.now().toString()
    });

    const notebookId = await db.notebooks.add(TEST_NOTEBOOK);

    let sessions = await db.noteHistory.get(noteId);
    expect(sessions).toHaveLength(1);

    const note = { ...db.notes.note(noteId)?.data };

    await db.notebooks.delete(notebookId);
    await db.notes.delete(noteId);

    expect(db.trash.all).toHaveLength(2);

    await db.trash.clear();

    expect(db.trash.all).toHaveLength(0);

    const content = note.contentId && (await db.content.get(note.contentId));
    expect(content).toBeUndefined();

    sessions = await db.noteHistory.get(noteId);
    expect(sessions).toHaveLength(0);
  }));
