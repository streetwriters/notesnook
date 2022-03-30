import dayjs from "dayjs";
import {
  StorageInterface,
  noteTest,
  notebookTest,
  TEST_NOTE,
  TEST_NOTEBOOK,
  databaseTest,
} from "./utils";

beforeEach(() => StorageInterface.clear());

test("trash should be empty", () =>
  databaseTest().then((db) => {
    expect(db.trash.all).toHaveLength(0);
  }));

test("permanently delete a note", () =>
  databaseTest().then(async (db) => {
    const noteId = await db.notes.add({...TEST_NOTE,sessionId:Date.now()});
    const note = db.notes.note(noteId);

    let sessions = await db.noteHistory.get(noteId);
    expect(sessions).toHaveLength(1);

    await db.notes.delete(noteId);
    expect(db.trash.all).toHaveLength(1);
    expect(await note.content()).toBeDefined();
    await db.trash.delete(db.trash.all[0].id);
    expect(db.trash.all).toHaveLength(0);
    const content = await db.content.raw(note.data.contentId);
    expect(content.deleted).toBe(true);

    sessions = await db.noteHistory.get(noteId);
    expect(sessions).toHaveLength(0);
}));

test("restore a deleted note that was in a notebook", () =>
  noteTest().then(async ({ db, id }) => {
    let nbId = await db.notebooks.add(TEST_NOTEBOOK);
    await db.notebooks.notebook(nbId).topics.topic("hello").add(id);
    await db.notes.delete(id);
    await db.trash.restore(db.trash.all[0].id);
    expect(db.trash.all).toHaveLength(0);

    let note = db.notes.note(id);

    expect(note).toBeDefined();
    expect(await note.content()).toBe(TEST_NOTE.content.data);

    const notebook = db.notebooks.notebook(nbId);
    expect(notebook.topics.topic("hello").has(id)).toBe(true);

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
    await db.notebooks.notebook(nbId).topics.topic("hello").add(id);
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
    await db.notebooks.notebook(id).topics.topic("hello").add(noteId);
    await db.notebooks.delete(id);
    expect(db.notebooks.notebook(id)).toBeUndefined();
    expect(db.notes.note(noteId).notebook).toBeUndefined();
  }));

test("restore a deleted notebook", () =>
  notebookTest().then(async ({ db, id }) => {
    let noteId = await db.notes.add(TEST_NOTE);
    await db.notebooks.notebook(id).topics.topic("hello").add(noteId);
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
    await db.notebooks.notebook(id).topics.topic("hello").add(noteId);
    await db.notebooks.delete(id);
    await db.notes.delete(noteId);
    const deletedNotebook = db.trash.all.find(
      (v) => v.id === id && v.itemType === "notebook"
    );
    await db.trash.restore(deletedNotebook.id);
    let notebook = db.notebooks.notebook(id);
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

    await db.notes._collection.updateItem({
      id: noteId,
      dateDeleted: sevenDaysEarlier,
    });

    await db.notebooks._collection.updateItem({
      id: notebookId,
      dateDeleted: sevenDaysEarlier,
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

    const content = await db.content.raw(note.contentId);
    expect(content.deleted).toBe(true);

    sessions = await db.noteHistory.get(note.id);
    expect(sessions).toHaveLength(0);
  }));
