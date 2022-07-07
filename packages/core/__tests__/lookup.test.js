import {
  StorageInterface,
  noteTest,
  TEST_NOTE,
  notebookTest,
  TEST_NOTEBOOK2,
} from "./utils";

beforeEach(async () => {
  StorageInterface.clear();
});

const content = {
  ...TEST_NOTE.content,
  data: "<p>hello i am a note of the world</p>",
};

//TODO
test("search notes", () =>
  noteTest({
    content: content,
  }).then(async ({ db }) => {
    await db.notes.add(TEST_NOTE);
    let filtered = await db.lookup.notes(db.notes.all, "note of the world");
    expect(filtered).toHaveLength(1);
  }));

test("search notes with a locked note", () =>
  noteTest({
    content: content,
  }).then(async ({ db }) => {
    const noteId = await db.notes.add(TEST_NOTE);
    await db.vault.create("password");
    await db.vault.add(noteId);
    let filtered = await db.lookup.notes(db.notes.all, "note of the world");
    expect(filtered).toHaveLength(1);
  }));

test("search notes with an empty note", () =>
  noteTest({
    content: content,
  }).then(async ({ db }) => {
    await db.notes.add({
      title: "world is a heavy tune",
      content: { type: "tiptap", data: "<p><br></p>" },
    });
    let filtered = await db.lookup.notes(db.notes.all, "heavy tune");
    expect(filtered).toHaveLength(1);
  }));

test("search notebooks", () =>
  notebookTest().then(async ({ db }) => {
    await db.notebooks.add(TEST_NOTEBOOK2);
    let filtered = db.lookup.notebooks(db.notebooks.all, "Description");
    expect(filtered.length).toBeGreaterThan(0);
  }));

test("search topics", () =>
  notebookTest().then(async ({ db, id }) => {
    const topics = db.notebooks.notebook(id).topics.all;
    let filtered = db.lookup.topics(topics, "hello");
    expect(filtered).toHaveLength(1);
  }));
