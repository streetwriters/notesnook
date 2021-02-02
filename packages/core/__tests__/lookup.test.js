import {
  StorageInterface,
  databaseTest,
  noteTest,
  groupedTest,
  LONG_TEXT,
  TEST_NOTE,
  TEST_NOTEBOOK,
  notebookTest,
  TEST_NOTEBOOK2,
} from "./utils";

beforeEach(async () => {
  StorageInterface.clear();
});

const content = { ...TEST_NOTE.content, data: "<p>5</p>" };

//TODO
test("search notes", () =>
  noteTest({
    content: content,
  }).then(async ({ db }) => {
    await db.notes.add(TEST_NOTE);
    let filtered = await db.lookup.notes(db.notes.all, "5");
    expect(filtered.length).toBe(1);
  }));

test("search notes with a locked note", () =>
  noteTest({
    content: content,
  }).then(async ({ db }) => {
    const noteId = await db.notes.add(TEST_NOTE);
    await db.vault.create("password");
    await db.vault.add(noteId);
    let filtered = await db.lookup.notes(db.notes.all, "5");
    expect(filtered.length).toBe(1);
  }));

test("search notes with an empty note", () =>
  noteTest({
    content: content,
  }).then(async ({ db }) => {
    await db.notes.add({
      title: "hello world",
      content: { type: "tiny", data: "<p><br></p>" },
    });
    let filtered = await db.lookup.notes(db.notes.all, "hello world");
    expect(filtered.length).toBe(1);
  }));

test("search notebooks", () =>
  notebookTest().then(async ({ db }) => {
    await db.notebooks.add(TEST_NOTEBOOK2);
    let filtered = db.lookup.notebooks(db.notebooks.all, "hello");
    expect(filtered.length).toBe(1);
  }));

test("search topics", () =>
  notebookTest().then(async ({ db, id }) => {
    const topics = db.notebooks.notebook(id).topics.all;
    let filtered = db.lookup.topics(topics, "hello");
    expect(filtered.length).toBe(1);
  }));
