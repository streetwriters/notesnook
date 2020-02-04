import { StorageInterface, notebookTest, TEST_NOTEBOOK } from "./utils";

beforeEach(async () => {
  StorageInterface.clear();
});

test("add a notebook", () =>
  notebookTest().then(({ db, id }) => {
    expect(id).toBeDefined();
    let notebook = db.notebooks.get(id);
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
    description: "searched description"
  }).then(({ db }) => {
    let filtered = db.notebooks.filter("searhed");
    expect(filtered.length).toBeGreaterThan(0);
  }));

test("pin a notebook", () =>
  notebookTest().then(async ({ db, id }) => {
    await db.notebooks.pin(id);
    let notebook = db.notebooks.get(id);
    expect(notebook.pinned).toBe(true);
  }));

test("unpin a notebook", () =>
  notebookTest().then(async ({ db, id }) => {
    await db.notebooks.unpin(id);
    let notebook = db.notebooks.get(id);
    expect(notebook.pinned).toBe(false);
  }));

test("favorite a notebook", () =>
  notebookTest().then(async ({ db, id }) => {
    await db.notebooks.favorite(id);
    let notebook = db.notebooks.get(id);
    expect(notebook.favorite).toBe(true);
  }));

test("unfavorite a notebook", () =>
  notebookTest().then(async ({ db, id }) => {
    await db.notebooks.unfavorite(id);
    let notebook = db.notebooks.get(id);
    expect(notebook.favorite).toBe(false);
  }));
