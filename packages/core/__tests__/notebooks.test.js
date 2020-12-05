import {
  StorageInterface,
  notebookTest,
  TEST_NOTEBOOK,
  TEST_NOTE,
} from "./utils";

beforeEach(async () => {
  StorageInterface.clear();
});

test("add a notebook", () =>
  notebookTest().then(({ db, id }) => {
    expect(id).toBeDefined();
    let notebook = db.notebooks.notebook(id);
    expect(notebook).toBeDefined();
    expect(notebook.title).toBe(TEST_NOTEBOOK.title);
  }));

test("get all notebooks", () =>
  notebookTest().then(({ db }) => {
    expect(db.notebooks.all.length).toBeGreaterThan(0);
  }));

test("search all notebooks", () =>
  notebookTest({
    ...TEST_NOTEBOOK,
    title: "I will be searched.",
    description: "searched description",
  }).then(({ db }) => {
    let filtered = db.notebooks.filter("searhed");
    expect(filtered.length).toBeGreaterThan(0);
  }));

test("pin a notebook", () =>
  notebookTest().then(async ({ db, id }) => {
    let notebook = db.notebooks.notebook(id);
    await notebook.pin();
    notebook = db.notebooks.notebook(id);
    expect(notebook.data.pinned).toBe(true);
  }));

test("unpin a notebook", () =>
  notebookTest().then(async ({ db, id }) => {
    let notebook = db.notebooks.notebook(id);
    await notebook.pin();
    notebook = db.notebooks.notebook(id);
    expect(notebook.data.pinned).toBe(true);
    await notebook.pin();
    notebook = db.notebooks.notebook(id);
    expect(notebook.data.pinned).toBe(false);
  }));

test("delete a notebook", () =>
  notebookTest().then(async ({ db, id }) => {
    let noteId = await db.notes.add(TEST_NOTE);
    await db.notebooks.notebook(id).topics.topic("General").add(noteId);
    expect(db.notebooks.notebook(id).topics.topic("General").has(noteId)).toBe(
      true
    );
    let note = db.notes.note(noteId);

    expect(note.notebooks.some((n) => n.id === id)).toBe(true);

    await db.notebooks.delete(id);
    expect(db.notebooks.notebook(id).data.deleted).toBe(true);
    note = db.notes.note(noteId);

    expect(note.notebooks.length).toBe(0);
  }));
