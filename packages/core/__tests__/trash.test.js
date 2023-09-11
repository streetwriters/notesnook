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
    const noteId = await db.notes.add({ ...TEST_NOTE, sessionId: Date.now() });
    const note = db.notes.note(noteId);

    let sessions = await db.noteHistory.get(noteId);
    expect(sessions).toHaveLength(1);

    await db.notes.delete(noteId);
    expect(db.trash.all).toHaveLength(1);
    expect(await note.content()).toBeDefined();
    await db.trash.delete(db.trash.all[0].id);
    expect(db.trash.all).toHaveLength(0);
    const content = await db.content.get(note.data.contentId);
    expect(content).toBeUndefined();

    sessions = await db.noteHistory.get(noteId);
    expect(sessions).toHaveLength(0);
  }));

test("restore a deleted note that was in a notebook", () =>
  noteTest().then(async ({ db, id }) => {
    let nbId = await db.notebooks.add(TEST_NOTEBOOK);
    const topic = db.notebooks.notebook(nbId).topics.topic("hello");
    await db.notes.addToNotebook({ id: nbId, topic: topic.id }, id);

    await db.notes.delete(id);
    await db.trash.restore(db.trash.all[0].id);
    expect(db.trash.all).toHaveLength(0);

    let note = db.notes.note(id);

    expect(note).toBeDefined();
    expect(await note.content()).toBe(TEST_NOTE.content.data);

    const notebook = db.notebooks.notebook(nbId);
    expect(notebook.topics.topic(topic.id).has(id)).toBe(true);

    expect(note.notebooks.some((n) => n.id === nbId)).toBe(true);

    expect(notebook.topics.has("hello")).toBeDefined();
  }));

test("delete a locked note", () =>
  noteTest().then(async ({ db, id }) => {
    const note = db.notes.note(id);
    await db.vault.create("password");
    await db.vault.add(id);
    await db.notes.delete(id);
    expect(db.trash.all).toHaveLength(1);
    expect(await db.content.get(note.data.contentId)).toBeDefined();
  }));

test("restore a deleted locked note", () =>
  noteTest().then(async ({ db, id }) => {
    let note = db.notes.note(id);
    await db.vault.create("password");
    await db.vault.add(id);
    await db.notes.delete(id);
    expect(db.trash.all).toHaveLength(1);
    expect(await db.content.get(note.data.contentId)).toBeDefined();
    await db.trash.restore(db.trash.all[0].id);
    expect(db.trash.all).toHaveLength(0);
    note = db.notes.note(id);
    expect(note).toBeDefined();
  }));

test("restore a deleted note that's in a deleted notebook", () =>
  noteTest().then(async ({ db, id }) => {
    let nbId = await db.notebooks.add(TEST_NOTEBOOK);
    const topic = db.notebooks.notebook(nbId).topics.topic("hello");
    await db.notes.addToNotebook({ id: nbId, topic: topic.id }, id);

    await db.notes.delete(id);
    await db.notebooks.delete(nbId);
    const deletedNote = db.trash.all.find(
      (v) => v.id === id && v.itemType === "note"
    );
    await db.trash.restore(deletedNote.id);
    let note = db.notes.note(id);
    expect(note).toBeDefined();
    expect(db.notes.note(id).notebook).toBeUndefined();
  }));

test("delete a notebook", () =>
  notebookTest().then(async ({ db, id }) => {
    let noteId = await db.notes.add(TEST_NOTE);
    let notebook = db.notebooks.notebook(id);
    const topic = notebook.topics.topic("hello");
    await db.notes.addToNotebook({ id, topic: topic.id }, noteId);

    await db.notebooks.delete(id);
    expect(db.notebooks.notebook(id)).toBeUndefined();
    expect(db.notes.note(noteId).notebook).toBeUndefined();
  }));

test("restore a deleted notebook", () =>
  notebookTest().then(async ({ db, id }) => {
    let noteId = await db.notes.add(TEST_NOTE);
    const topic = db.notebooks.notebook(id).topics.topic("hello");
    await db.notes.addToNotebook({ id, topic: topic.id }, noteId);

    await db.notebooks.delete(id);
    await db.trash.restore(id);

    let notebook = db.notebooks.notebook(id);
    expect(notebook).toBeDefined();

    let note = db.notes.note(noteId);
    const noteNotebook = note.notebooks.find((n) => n.id === id);
    expect(noteNotebook).toBeDefined();
    expect(noteNotebook.topics).toHaveLength(1);
    expect(notebook.topics.topic(noteNotebook.topics[0])).toBeDefined();
  }));

test("restore a notebook that has deleted notes", () =>
  notebookTest().then(async ({ db, id }) => {
    let noteId = await db.notes.add(TEST_NOTE);

    let notebook = db.notebooks.notebook(id);
    const topic = notebook.topics.topic("hello");
    await db.notes.addToNotebook({ id, topic: topic.id }, noteId);

    await db.notebooks.delete(id);
    await db.notes.delete(noteId);
    const deletedNotebook = db.trash.all.find(
      (v) => v.id === id && v.itemType === "notebook"
    );
    await db.trash.restore(deletedNotebook.id);
    notebook = db.notebooks.notebook(id);
    expect(notebook).toBeDefined();
    expect(notebook.topics.topic("hello").has(noteId)).toBe(false);
  }));

test("permanently delete items older than 7 days", () =>
  databaseTest().then(async (db) => {
    const sevenDaysEarlier = dayjs().subtract(8, "days").toDate().getTime();
    const noteId = await db.notes.add(TEST_NOTE);
    const notebookId = await db.notebooks.add(TEST_NOTEBOOK);

    await db.notebooks.delete(notebookId);
    await db.notes.delete(noteId);

    await db.notes.collection.update({
      type: "trash",
      id: noteId,
      dateDeleted: sevenDaysEarlier
    });

    await db.notebooks.collection.update({
      type: "trash",
      id: notebookId,
      dateDeleted: sevenDaysEarlier
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
    const noteId = await db.notes.add({ ...TEST_NOTE, sessionId: Date.now() });

    const notebookId = await db.notebooks.add(TEST_NOTEBOOK);

    let sessions = await db.noteHistory.get(noteId);
    expect(sessions).toHaveLength(1);

    let note = { ...db.notes.note(noteId).data };

    await db.notebooks.delete(notebookId);
    await db.notes.delete(noteId);

    expect(db.trash.all).toHaveLength(2);

    await db.trash.clear();

    expect(db.trash.all).toHaveLength(0);

    const content = await db.content.get(note.contentId);
    expect(content).toBeUndefined();

    sessions = await db.noteHistory.get(note.id);
    expect(sessions).toHaveLength(0);
  }));
