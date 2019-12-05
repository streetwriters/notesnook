import Database from "../api/database";
import StorageInterface from "../../notes-web/src/interfaces/storage";

const db = new Database(StorageInterface);

const TEST_NOTE = {
  title: "I am a title",
  content: { delta: "I am a delta", text: "I am a text" }
};

const TEST_NOTEBOOK = {
  title: "Test Notebook",
  description: "Test Description",
  topics: ["hello"]
};

test("storage is defined", () => {
  expect(db.storage).toBeDefined();
});

test("add undefined note", async () => {
  let timestamp = await db.addNote();
  expect(timestamp).toBeUndefined();
  timestamp = await db.addNote({});
  expect(timestamp).toBeUndefined();
});

test("add a note", async () => {
  let timestamp = await db.addNote(TEST_NOTE);
  expect(timestamp).toBeGreaterThan(0);
  TEST_NOTE["dateCreated"] = timestamp;
});

test("get all notes", () => {
  let notes = db.getNotes();
  expect(notes.length).toBeGreaterThan(0);
});

test("search all notes", () => {
  let filtered = db.searchNotes("text");
  expect(filtered.length).toBeGreaterThan(0);
});

test("get a note", () => {
  let note = db.getNote(TEST_NOTE.dateCreated);
  expect(note.title).toBe("I am a title");
});

test("update note", async () => {
  let updateTimestamp = await db.addNote({
    ...TEST_NOTE,
    title: "I am a new title"
  });
  expect(updateTimestamp).toBe(TEST_NOTE.dateCreated);
});

test("add a notebook", async () => {
  let id = await db.addNotebook(TEST_NOTEBOOK);
  TEST_NOTEBOOK["dateCreated"] = id;
  expect(id).toBeGreaterThan(0);
});

test("get all notebooks", () => {
  let notebooks = db.getNotebooks();
  expect(notebooks.length).toBeGreaterThan(0);
});

test("get a notebook", () => {
  let notebook = db.getNotebook(TEST_NOTEBOOK.dateCreated);
  expect(notebook).toBeDefined();
});

test("add topic to notebook", async () => {
  await db.addTopicToNotebook(TEST_NOTEBOOK.dateCreated, "Home");
  let notebook = db.getNotebook(TEST_NOTEBOOK.dateCreated);
  expect(notebook.topics.hasOwnProperty("Home")).toBe(true);
});

test("add note to topic", async () => {
  await db.addNoteToTopic(
    TEST_NOTEBOOK.dateCreated,
    "Home",
    TEST_NOTE.dateCreated
  );
  let notebook = db.getNotebook(TEST_NOTEBOOK.dateCreated);
  expect(notebook.topics["Home"][0]).toBeGreaterThan(0);
});

test("note has notebook", () => {
  let note = db.getNote(TEST_NOTE.dateCreated);
  expect(note.notebooks.hasOwnProperty(TEST_NOTEBOOK.dateCreated)).toBe(true);
});

test("get topic", () => {
  let notes = db.getTopic(TEST_NOTEBOOK.dateCreated, "Home");
  expect(notes.length).toBeGreaterThan(0);
});

test("delete note from topic", async () => {
  await db.deleteNoteFromTopic(
    TEST_NOTEBOOK.dateCreated,
    "Home",
    TEST_NOTE.dateCreated
  );
  let notebook = db.getNotebook(TEST_NOTEBOOK.dateCreated);
  expect(notebook.topics["Home"][0]).toBeUndefined();
});

test("note doesn't have notebook", () => {
  let note = db.getNote(TEST_NOTE.dateCreated);
  expect(note.notebooks.hasOwnProperty(TEST_NOTEBOOK.dateCreated)).toBe(false);
});

test("delete topic from notebook", async () => {
  await db.deleteTopicFromNotebook(TEST_NOTEBOOK.dateCreated, "Home");
  let notebook = db.getNotebook(TEST_NOTEBOOK.dateCreated);
  expect(notebook.topics.hasOwnProperty("Home")).toBe(false);
});

test("delete note", async () => {
  await db.deleteNotes([TEST_NOTE]);
  let note = db.getNote(TEST_NOTE.dateCreated);
  expect(note).toBeUndefined();
});

test("delete notebook", async () => {
  await db.deleteNotebooks([TEST_NOTEBOOK]);
  let notebook = db.getNotebook(TEST_NOTEBOOK.dateCreated);
  expect(notebook).toBeUndefined();
});

test("delete unknown key", async () => {});
