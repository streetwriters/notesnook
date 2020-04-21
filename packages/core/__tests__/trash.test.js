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
    expect(db.trash.all.length).toBe(0);
  }));

test("permanently delete a note", () =>
  noteTest().then(async ({ db, id }) => {
    const note = db.notes.note(id);
    await db.notes.delete(id);
    expect(db.trash.all.length).toBe(1);
    expect(await note.delta()).toBeDefined();
    await db.trash.delete(db.trash.all[0].id);
    expect(db.trash.all.length).toBe(0);
    const delta = await db.delta.raw(note.data.content.delta);
    expect(delta.deleted).toBe(true);
  }));

test("restore a deleted note", () =>
  noteTest().then(async ({ db, id }) => {
    let nbId = await db.notebooks.add(TEST_NOTEBOOK);
    await db.notebooks.notebook(nbId).topics.topic("General").add(id);
    await db.notes.delete(id);
    await db.trash.restore(db.trash.all[0].id);
    expect(db.trash.all.length).toBe(0);
    let note = db.notes.note(id);
    expect(note).toBeDefined();
    expect(await note.text()).toBe(TEST_NOTE.content.text);
    expect(await note.delta()).toStrictEqual(TEST_NOTE.content.delta);
    expect(db.notebooks.notebook(nbId).topics.topic("General").has(id)).toBe(
      true
    );
    expect(db.notes.note(id).notebook.id).toBe(nbId);
    expect(db.notes.note(id).notebook.topic).toBe("General");
  }));

test("delete a locked note", () =>
  noteTest().then(async ({ db, id }) => {
    const note = db.notes.note(id);
    await db.vault.create("password");
    await db.vault.add(id);
    await db.notes.delete(id);
    expect(db.trash.all.length).toBe(1);
    expect(await db.delta.get(note.data.content.delta)).toBeDefined();
  }));

test("restore a deleted locked note", () =>
  noteTest().then(async ({ db, id }) => {
    let note = db.notes.note(id);
    await db.vault.create("password");
    await db.vault.add(id);
    await db.notes.delete(id);
    expect(db.trash.all.length).toBe(1);
    expect(await db.delta.get(note.data.content.delta)).toBeDefined();
    await db.trash.restore(db.trash.all[0].id);
    expect(db.trash.all.length).toBe(0);
    note = db.notes.note(id);
    expect(note).toBeDefined();
  }));

test("restore a deleted note that's in a deleted notebook", () =>
  noteTest().then(async ({ db, id }) => {
    let nbId = await db.notebooks.add(TEST_NOTEBOOK);
    await db.notebooks.notebook(nbId).topics.topic("General").add(id);
    await db.notes.delete(id);
    await db.notebooks.delete(nbId);
    const deletedNote = db.trash.all.find(
      (v) => v.itemId.includes(id) && v.type === "note"
    );
    await db.trash.restore(deletedNote.id);
    let note = db.notes.note(id);
    expect(note).toBeDefined();
    expect(db.notes.note(id).notebook).toStrictEqual({});
  }));

test("delete a notebook", () =>
  notebookTest().then(async ({ db, id }) => {
    let noteId = await db.notes.add(TEST_NOTE);
    await db.notebooks.notebook(id).topics.topic("General").add(noteId);
    await db.notebooks.delete(id);
    expect(db.notebooks.notebook(id).data.deleted).toBe(true);
    expect(db.notes.note(noteId).notebook).toStrictEqual({});
  }));

test("restore a deleted notebook", () =>
  notebookTest().then(async ({ db, id }) => {
    let noteId = await db.notes.add(TEST_NOTE);
    await db.notebooks.notebook(id).topics.topic("General").add(noteId);
    await db.notebooks.delete(id);
    await db.trash.restore(db.trash.all[0].id);
    let notebook = db.notebooks.notebook(id);
    expect(notebook).toBeDefined();
    expect(db.notes.note(noteId).notebook.id).toBe(id);
    expect(db.notes.note(noteId).notebook.topic).toBe("General");
  }));

test("restore a notebook that has deleted notes", () =>
  notebookTest().then(async ({ db, id }) => {
    let noteId = await db.notes.add(TEST_NOTE);
    await db.notebooks.notebook(id).topics.topic("General").add(noteId);
    await db.notebooks.delete(id);
    await db.notes.delete(noteId);
    const deletedNotebook = db.trash.all.find(
      (v) => v.itemId.includes(id) && v.type === "notebook"
    );
    await db.trash.restore(deletedNotebook.id);
    let notebook = db.notebooks.notebook(id);
    expect(notebook).toBeDefined();
    expect(notebook.topics.topic("General").has(noteId)).toBe(false);
  }));
