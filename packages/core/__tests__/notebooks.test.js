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

test("updating notebook with empty title should throw", () =>
  notebookTest().then(async ({ db, id }) => {
    expect(id).toBeDefined();
    await expect(db.notebooks.add({ id, title: "" })).rejects.toThrow();
  }));
