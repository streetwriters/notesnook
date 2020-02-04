import DB from "../api";
import StorageInterface from "../__mocks__/storage.mock";

const TEST_NOTEBOOK = {
  title: "Test Notebook",
  description: "Test Description",
  topics: ["hello", "hello", "    "]
};
const TEST_NOTEBOOK2 = {
  title: "Test Notebook 2",
  description: "Test Description 2",
  topics: ["Home2"]
};

function databaseTest() {
  let db = new DB(StorageInterface);
  return db.init().then(() => db);
}

const notebookTest = (notebook = TEST_NOTEBOOK) =>
  databaseTest().then(async db => {
    let id = await db.notebooks.add(notebook);
    return { db, id };
  });

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

test("get empty topic", () =>
  notebookTest().then(({ db, id }) => {
    let notes = db.notebooks.topics(id).get("General");
    expect(notes.length).toBe(0);
  }));

test("getting invalid topic should throw", () =>
  notebookTest().then(({ db, id }) => {
    expect(() => db.notebooks.topics(id).get("invalid")).toThrow();
  }));

test("add topic to notebook", () =>
  notebookTest().then(async ({ db, id }) => {
    let topics = db.notebooks.topics(id);
    await topics.add("Home");
    expect(topics.all.length).toBeGreaterThan(1);
    expect(topics.all.findIndex(v => v.title === "Home")).toBeGreaterThan(-1);
  }));

test("duplicate topic to notebook should not be added", () =>
  notebookTest().then(async ({ db, id }) => {
    let topics = db.notebooks.topics(id);
    await topics.add("Home");
    let len = topics.all.length;
    await topics.add("Home");
    expect(topics.all.length).toBe(len);
  }));
