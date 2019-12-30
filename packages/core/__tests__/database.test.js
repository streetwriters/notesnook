import Database from "../api/database";
import StorageInterface from "../../notes-web/src/interfaces/storage";

function databaseTest() {
  let db = new Database(StorageInterface);
  return db.init().then(() => db);
}

const noteTest = (note = TEST_NOTE) =>
  databaseTest().then(async db => {
    let timestamp = await db.addNote(note);
    return { db, timestamp };
  });

const notebookTest = (notebook = TEST_NOTEBOOK) =>
  databaseTest().then(async db => {
    let timestamp = await db.addNotebook(notebook);
    return { db, timestamp };
  });

const topicTest = (topic = "Home") =>
  notebookTest().then(async ({ db, timestamp }) => {
    await db.addTopicToNotebook(timestamp, topic);
    return { db, timestamp, topic };
  });

const topicNoteTest = (topic = "Home") =>
  topicTest(topic).then(async ({ db, timestamp, topic }) => {
    let noteTimestamp = await db.addNote(TEST_NOTE);
    await db.addNoteToTopic(timestamp, topic, noteTimestamp);
    return { db, timestamp, topic, noteTimestamp };
  });

const TEST_NOTE = {
  content: { delta: "I am a delta", text: "I am a text" }
};

const LONG_TEXT =
  "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";

const TEST_NOTEBOOK = {
  title: "Test Notebook",
  description: "Test Description",
  topics: ["hello", "hello"]
};

const TEST_NOTEBOOK2 = {
  title: "Test Notebook 2",
  description: "Test Description 2",
  topics: ["Home2"]
};

afterEach(() => StorageInterface.clear());

test("add invalid note", () =>
  databaseTest().then(async db => {
    let timestamp = await db.addNote();
    expect(timestamp).toBeUndefined();
    timestamp = await db.addNote({});
    expect(timestamp).toBeUndefined();
    timestamp = await db.addNote({ hello: "world" });
    expect(timestamp).toBeUndefined();
  }));

test("add a note", () =>
  noteTest().then(({ timestamp }) => expect(timestamp).toBeGreaterThan(0)));

test("get all notes", () =>
  noteTest().then(({ db }) => {
    let notes = db.getNotes();
    expect(notes.length).toBeGreaterThan(0);
  }));

test("search all notes", () =>
  noteTest({
    content: { delta: "5", text: "5" }
  }).then(({ db }) => {
    let filtered = db.searchNotes("5");
    expect(filtered.length).toBeGreaterThan(0);
  }));

test("get a note", () =>
  noteTest().then(({ db, timestamp }) => {
    let note = db.getNote(timestamp);
    expect(note.dateCreated).toBe(timestamp);
  }));

test("note without a title should get title from content", () =>
  noteTest().then(({ db, timestamp }) => {
    let note = db.getNote(timestamp);
    expect(note.title).toBe("I am a");
  }));

test("update note", () =>
  noteTest().then(async ({ db, timestamp }) => {
    let updateTimestamp = await db.addNote({
      dateCreated: timestamp,
      title: "I am a new title",
      content: {
        text: LONG_TEXT,
        delta: []
      },
      pinned: true,
      favorite: true,
      colors: ["red", "blue"]
    });
    expect(updateTimestamp).toBe(timestamp);
    let note = db.getNote(updateTimestamp);
    expect(note.pinned).toBe(true);
    expect(note.favorite).toBe(true);
    expect(note.colors).toStrictEqual(["red", "blue"]);
  }));

test("note with text longer than 150 characters should have ... in the headline", () =>
  noteTest({
    content: {
      text: LONG_TEXT,
      delta: []
    }
  }).then(({ db, timestamp }) => {
    let note = db.getNote(timestamp);
    expect(note.headline.includes("...")).toBe(true);
  }));

test("get favorites", () =>
  noteTest({
    pinned: true,
    favorite: true,
    content: { delta: "Hello", text: "Hello" }
  }).then(({ db }) => {
    let favorites = db.getFavorites();
    expect(favorites.length).toBeGreaterThan(0);
  }));

test("add a notebook", () =>
  notebookTest().then(({ timestamp }) => {
    expect(timestamp).toBeGreaterThan(0);
  }));

test("duplicate notebook should not be added", () =>
  notebookTest().then(async ({ db }) => {
    let id = await db.addNotebook(TEST_NOTEBOOK);
    expect(id).toBeUndefined();
  }));

test("get all notebooks", () =>
  notebookTest().then(({ db }) => {
    let notebooks = db.getNotebooks();
    expect(notebooks.length).toBeGreaterThan(0);
  }));

test("get a notebook", () =>
  notebookTest().then(({ db, timestamp }) => {
    let notebook = db.getNotebook(timestamp);
    expect(notebook).toBeDefined();
  }));

test("get empty topic", () =>
  notebookTest().then(({ db, timestamp }) => {
    let notes = db.getTopic(timestamp, "General");
    expect(notes.length).toBe(0);
  }));

test("getting invalid topic should return undefined", () =>
  notebookTest().then(({ db, timestamp }) => {
    let notes = db.getTopic(timestamp, "invalid");
    expect(notes).toBeUndefined();
  }));

test("add topic to notebook", () =>
  topicTest().then(({ db, timestamp, topic }) => {
    let notebook = db.getNotebook(timestamp);
    let topicIndex = notebook.topics.findIndex(t => t.title === topic);
    expect(topicIndex).toBeGreaterThan(-1);
  }));

test("duplicate topic to notebook should not be added", () =>
  topicTest().then(async ({ db, timestamp, topic }) => {
    let res = await db.addTopicToNotebook(timestamp, topic);
    expect(res).toBe(false);
  }));

test("add note to topic", async () =>
  topicNoteTest().then(async ({ db, timestamp, topic, noteTimestamp }) => {
    let notebook = db.getNotebook(timestamp);
    let topicIndex = notebook.topics.findIndex(t => t.title === topic);
    expect(notebook.topics[topicIndex].notes[0]).toBe(noteTimestamp);
    let note = db.getNote(noteTimestamp);
    expect(note.notebook.notebook).toBe(timestamp);
  }));

test("duplicate note to topic should not be added", async () =>
  topicNoteTest().then(async ({ db, timestamp, topic, noteTimestamp }) => {
    let res = await db.addNoteToTopic(timestamp, topic, noteTimestamp);
    expect(res).toBe(false);
  }));

test("get topic", async () =>
  topicNoteTest().then(async ({ db, timestamp, topic }) => {
    let notes = db.getTopic(timestamp, topic);
    expect(notes.length).toBeGreaterThan(0);
  }));

test("move note", async () =>
  noteTest().then(async ({ db, timestamp }) => {
    let notebook1 = await db.addNotebook(TEST_NOTEBOOK);
    expect(await db.addTopicToNotebook(notebook1, "Home")).toBe(true);
    expect(await db.addNoteToTopic(notebook1, "Home", timestamp)).toBe(true);
    let notebook2 = await db.addNotebook(TEST_NOTEBOOK2);
    let res = await db.moveNote(
      timestamp,
      { notebook: notebook1, topic: "Home" },
      { notebook: notebook2, topic: "Home2" }
    );
    expect(res).toBe(true);
  }));

test("deletion of note from invalid topic should return false", () =>
  noteTest().then(async ({ db, noteId = timestamp }) => {
    let timestamp = await db.addNotebook(TEST_NOTEBOOK);
    let res = await db.deleteNoteFromTopic(timestamp, "invalid_topic", noteId);
    expect(res).toBe(false);
  }));

test("delete note from topic", () =>
  topicNoteTest().then(async ({ db, timestamp, topic, noteTimestamp }) => {
    await db.deleteNoteFromTopic(timestamp, topic, noteTimestamp);
    let notebook = db.getNotebook(timestamp);
    let topicIndex = notebook.topics.findIndex(t => t.title === topic);
    expect(notebook.topics[topicIndex].notes[0]).toBeUndefined();
  }));

test("delete topic from notebook", () =>
  topicTest().then(async ({ db, timestamp, topic }) => {
    await db.deleteTopicFromNotebook(timestamp, topic);
    let notebook = db.getNotebook(timestamp);
    let topicIndex = notebook.topics.findIndex(t => t.title === topic);
    expect(topicIndex).toBe(-1);
  }));

test("delete note", () =>
  noteTest().then(async ({ db, timestamp }) => {
    await db.deleteNotes([{ dateCreated: timestamp }]);
    let note = db.getNote(timestamp);
    expect(note).toBeUndefined();
  }));

test("delete notebook", () =>
  notebookTest().then(async ({ db, timestamp }) => {
    await db.deleteNotebooks([{ dateCreated: timestamp }]);
    let notebook = db.getNotebook(timestamp);
    expect(notebook).toBeUndefined();
  }));

test("trash should not be empty", () =>
  notebookTest().then(async ({ db, timestamp }) => {
    await db.deleteNotebooks([{ dateCreated: timestamp }]);
    let trash = db.getTrash();
    expect(trash.length).toBeGreaterThan(0);
  }));

test("restore an item from trash", () =>
  notebookTest().then(async ({ db, timestamp }) => {
    await db.deleteNotebooks([{ dateCreated: timestamp }]);
    let trash = db.getTrash();
    expect(trash.length).toBeGreaterThan(0);
    await db.restoreItem(timestamp);
    let notebook = db.getNotebook(timestamp);
    expect(notebook.dateCreated).toBe(timestamp);
  }));

test("clear trash should clear the trash", () =>
  notebookTest().then(async ({ db, timestamp }) => {
    await db.deleteNotebooks([{ dateCreated: timestamp }]);
    let trash = db.getTrash();
    expect(trash.length).toBeGreaterThan(0);
    await db.clearTrash();
    trash = db.getTrash();
    expect(trash.length).toBe(0);
  }));

//null & undefined checks

test("empty note should not be added", () =>
  databaseTest().then(async db => {
    let res = await db.addNote({});
    expect(res).toBeUndefined();
  }));

test("note with empty text should not be added", () =>
  databaseTest().then(async db => {
    let res = await db.addNote({ content: { text: "", delta: [] } });
    expect(res).toBeUndefined();
  }));

test("note with invalid delta should not be added", () =>
  databaseTest().then(async db => {
    let res = await db.addNote({
      content: { text: "i am a valid text", delta: undefined }
    });
    expect(res).toBeUndefined();
  }));

test("empty notebook should not be added", () =>
  databaseTest().then(async db => {
    let res = await db.addNotebook({});
    expect(res).toBeUndefined();
  }));

test("deletion of unknown item should return false", () =>
  databaseTest().then(async db => {
    let res = await db.deleteNotes(undefined);
    expect(res).toBe(false);
  }));

test("deletion of invalid items should cause continue and return true", () =>
  databaseTest().then(async db => {
    let res = await db.deleteNotes([null, null, "something"]);
    expect(res).toBe(true);
  }));

test("deletion of invalid topic from notebook should return false", () =>
  topicTest().then(async ({ db, timestamp }) => {
    let res = await db.deleteTopicFromNotebook(timestamp, "invalid_topic");
    expect(res).toBe(false);
  }));

test("moving note with wrong id should return false", () =>
  databaseTest().then(async db => {
    let res = await db.moveNote(0, undefined, undefined);
    expect(res).toBe(false);
  }));

test("moving note to non-existent notebook should return false", () =>
  databaseTest().then(async db => {
    let res = await await db.moveNote(
      29,
      { notebook: 2, topic: "2" },
      { notebook: 5, topic: "123" }
    );
    expect(res).toBe(false);
  }));

test("moving note to same notebook should return false", () =>
  databaseTest().then(async db => {
    let res = await db.moveNote(
      29,
      { notebook: 2, topic: "2" },
      { notebook: 2, topic: "2" }
    );
    expect(res).toBe(false);
  }));

test("search with empty query should return []", () =>
  databaseTest().then(async db => {
    let filtered = db.searchNotes("");
    expect(filtered).toStrictEqual([]);
  }));

test("getting invalid topic from invalid notebook should return undefined", () =>
  databaseTest().then(async db => {
    let res = await db.getTopic(1213, "invalid_topic");
    expect(res).toBeUndefined();
  }));
