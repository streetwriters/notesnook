import Database from "../api/database";
import StorageInterface from "../../notes-web/src/interfaces/storage";

const db = new Database(StorageInterface);

const TEST_NOTE = {
  content: { delta: "I am a delta", text: "I am a text" }
};

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

beforeAll(async () => {
  return await db.init();
});

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
  expect(note.dateCreated).toBe(TEST_NOTE.dateCreated);
});

test("note without a title should get title from content", () => {
  let note = db.getNote(TEST_NOTE.dateCreated);
  expect(note.title).toBe("I am a");
});

test("update note", async () => {
  let updateTimestamp = await db.addNote({
    ...TEST_NOTE,
    title: "I am a new title",
    content: {
      text:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
      delta: []
    }
  });
  expect(updateTimestamp).toBe(TEST_NOTE.dateCreated);
});

test("note with text longer than 150 characters should have ... in the headline", () => {
  let note = db.getNote(TEST_NOTE.dateCreated);
  expect(note.headline.includes("...")).toBe(true);
});

test("add a notebook", async () => {
  let id = await db.addNotebook(TEST_NOTEBOOK);
  TEST_NOTEBOOK["dateCreated"] = id;
  expect(id).toBeGreaterThan(0);
});

test("duplicate notebook should not be added", async () => {
  let id = await db.addNotebook(TEST_NOTEBOOK);
  expect(id).toBeUndefined();
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
  let topicIndex = notebook.topics.findIndex(t => t.title === "Home");
  expect(topicIndex).toBeGreaterThan(-1);
});

test("duplicate topic to notebook should not be added", async () => {
  let res = await db.addTopicToNotebook(TEST_NOTEBOOK.dateCreated, "Home");
  expect(res).toBe(false);
});

test("add note to topic", async () => {
  await db.addNoteToTopic(
    TEST_NOTEBOOK.dateCreated,
    "Home",
    TEST_NOTE.dateCreated
  );
  let notebook = db.getNotebook(TEST_NOTEBOOK.dateCreated);
  let topicIndex = notebook.topics.findIndex(t => t.title === "Home");
  expect(notebook.topics[topicIndex].notes[0]).toBeGreaterThan(0);
});

test("duplicate note to topic should not be added", async () => {
  let res = await db.addNoteToTopic(
    TEST_NOTEBOOK.dateCreated,
    "Home",
    TEST_NOTE.dateCreated
  );
  expect(res).toBe(false);
});

test("note has notebook", () => {
  let note = db.getNote(TEST_NOTE.dateCreated);
  expect(note.notebook.notebook).toBe(TEST_NOTEBOOK.dateCreated);
});

test("get empty topic", () => {
  let notes = db.getTopic(TEST_NOTEBOOK.dateCreated, "General");
  expect(notes.length).toBe(0);
});

test("get topic", () => {
  let notes = db.getTopic(TEST_NOTEBOOK.dateCreated, "Home");
  expect(notes.length).toBeGreaterThan(0);
});

test("getting invalid topic should return undefined", async () => {
  let res = await db.getTopic(TEST_NOTEBOOK.dateCreated, "invalid_topic");
  expect(res).toBeUndefined();
});

test("move note", async () => {
  let id = await db.addNotebook(TEST_NOTEBOOK2);
  TEST_NOTEBOOK2["dateCreated"] = id;
  expect(id).toBeGreaterThan(0);
  let res = await db.moveNote(
    TEST_NOTE.dateCreated,
    { notebook: TEST_NOTEBOOK.dateCreated, topic: "Home" },
    { notebook: id, topic: "Home2" }
  );
  expect(res).toBe(true);
});

test("notes don't contain notebooks", () => {
  let notes = db.getNotes().filter(v => v.type === "notebook");
  expect(notes.length).toBe(0);
});

test("notebooks don't contain notes", () => {
  let notebooks = db.getNotebooks().filter(v => v.type === "note");
  expect(notebooks.length).toBe(0);
});

test("deletion of note from invalid topic should return false", async () => {
  let res = await db.deleteNoteFromTopic(
    TEST_NOTEBOOK.dateCreated,
    "invalid_topic",
    TEST_NOTE.dateCreated
  );
  expect(res).toBe(false);
});

test("delete note from topic", async () => {
  await db.deleteNoteFromTopic(
    TEST_NOTEBOOK2.dateCreated,
    "Home2",
    TEST_NOTE.dateCreated
  );
  let notebook = db.getNotebook(TEST_NOTEBOOK.dateCreated);
  let topicIndex = notebook.topics.findIndex(t => t.title === "Home");
  expect(notebook.topics[topicIndex].notes[0]).toBeUndefined();
});

test("note doesn't have notebook", () => {
  let note = db.getNote(TEST_NOTE.dateCreated);
  expect(note.notebook).toStrictEqual({});
});

test("delete topic from notebook", async () => {
  await db.deleteTopicFromNotebook(TEST_NOTEBOOK.dateCreated, "Home");
  let notebook = db.getNotebook(TEST_NOTEBOOK.dateCreated);
  let topicIndex = notebook.topics.findIndex(t => t.title === "Home");
  expect(topicIndex).toBe(-1);
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

//null & undefined checks

test("empty note should not be added", async () => {
  let res = await db.addNote({});
  expect(res).toBeUndefined();
});

test("note with empty text should not be added", async () => {
  let res = await db.addNote({ content: { text: "", delta: [] } });
  expect(res).toBeUndefined();
});

test("note with invalid delta should not be added", async () => {
  let res = await db.addNote({ content: { text: "sacsa", delta: undefined } });
  expect(res).toBeUndefined();
});

test("empty notebook should not be added", async () => {
  let res = await db.addNotebook({});
  expect(res).toBeUndefined();
});

test("deletion of unknown item should return false", async () => {
  let res = await db.deleteNotes(undefined);
  expect(res).toBe(false);
});

test("deletion of invalid items should cause continue and return true", async () => {
  let res = await db.deleteNotes([null, null, "2021"]);
  expect(res).toBe(true);
});

test("deletion of invalid topic from notebook should return false", async () => {
  await db.addNotebook(TEST_NOTEBOOK2);
  let res = await db.deleteTopicFromNotebook(
    TEST_NOTEBOOK2.dateCreated,
    "invalid_topic"
  );
  expect(res).toBe(false);
  await db.deleteNotebooks([TEST_NOTEBOOK2]);
});

test("moving note with wrong id should return false", async () => {
  let res = await db.moveNote(0, undefined, undefined);
  expect(res).toBe(false);
});

test("moving note to non-existent notebook should return false", async () => {
  let res = await db.moveNote(
    29,
    { notebook: 2, topic: "2" },
    { notebook: 5, topic: "123" }
  );
  expect(res).toBe(false);
});

test("moving note to same notebook should return false", async () => {
  let res = await db.moveNote(
    29,
    { notebook: 2, topic: "2" },
    { notebook: 2, topic: "2" }
  );
  expect(res).toBe(false);
});

test("search with empty query should return []", () => {
  let filtered = db.searchNotes("");
  expect(filtered).toStrictEqual([]);
});

test("getting invalid topic from invalid notebook should return undefined", async () => {
  let res = await db.getTopic(1213, "invalid_topic");
  expect(res).toBeUndefined();
});
