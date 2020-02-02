import Database from "../api/database";
import StorageInterface from "../__mocks__/storage.mock";
import { getLastWeekTimestamp } from "../utils/date";

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

const groupedTest = (type, special = false) =>
  noteTest().then(async ({ db }) => {
    await db.addNote({ ...TEST_NOTE, title: "HELLO WHAT!" });
    await db.addNote({
      ...TEST_NOTE,
      title: "Some title",
      dateCreated: getLastWeekTimestamp() - 604800000
    });
    await db.addNote({
      ...TEST_NOTE,
      title: "Some title and title title",
      dateCreated: getLastWeekTimestamp() - 604800000 * 2
    });
    let grouped = db.groupNotes(type, special);
    if (special) {
      expect(grouped.items.length).toBeGreaterThan(0);
      expect(grouped.groups.length).toBeGreaterThan(0);
      expect(grouped.groupCounts.length).toBeGreaterThan(0);
      return;
    }
    expect(grouped.length).toBeGreaterThan(0);
    expect(grouped[0].data.length).toBeGreaterThan(0);
    expect(grouped[0].title.length).toBeGreaterThan(0);
  });

var TEST_NOTE;

const LONG_TEXT =
  "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";

var TEST_NOTEBOOK;
var TEST_NOTEBOOK2;

beforeEach(() => {
  StorageInterface.clear();
  TEST_NOTE = {
    content: { delta: "I am a delta", text: "I am a text" }
  };
  TEST_NOTEBOOK2 = {
    title: "Test Notebook 2",
    description: "Test Description 2",
    topics: ["Home2"]
  };
  TEST_NOTEBOOK = {
    title: "Test Notebook",
    description: "Test Description",
    topics: ["hello", "hello", "    "]
  };
});

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

test("updating empty note should delete it", () =>
  noteTest().then(async ({ db, timestamp }) => {
    let updateTimestamp = await db.addNote({
      dateCreated: timestamp,
      title: "\n\n",
      content: {
        text: "",
        delta: []
      },
      pinned: true,
      favorite: true,
      colors: ["red", "blue"]
    });
    expect(updateTimestamp).toBeUndefined();
  }));

test("updating note with duplicate colors", () =>
  noteTest({
    ...TEST_NOTE,
    colors: ["red", "blue"]
  }).then(async ({ db, timestamp }) => {
    let updateTimestamp = await db.addNote({
      dateCreated: timestamp,
      colors: ["red", "red", "blue", "blue"]
    });
    expect(updateTimestamp).toBe(timestamp);
    let note = db.getNote(updateTimestamp);
    expect(note.colors).toStrictEqual(["red", "blue"]);
  }));

test("add tag to note", () =>
  noteTest().then(async ({ db, timestamp }) => {
    await db.addTag(timestamp, "hello");
    expect(db.getNote(timestamp).tags[0]).toBe("hello");
    expect(db.getTags()[0].title).toBe("hello");
  }));

test("remove tag from note", () =>
  noteTest().then(async ({ db, timestamp }) => {
    await db.addTag(timestamp, "hello");
    expect(db.getNote(timestamp).tags[0]).toBe("hello");
    expect(db.getTags()[0].title).toBe("hello");
    await db.removeTag(timestamp, "hello");
    expect(db.getNote(timestamp).tags.length).toBe(0);
    expect(db.getTags().length).toBe(0);
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

test("get tags", () =>
  noteTest({
    ...TEST_NOTE,
    tags: ["new", "tag", "goes", "here"]
  }).then(async ({ db }) => {
    expect(db.getTags().length).toBeGreaterThan(0);
  }));

test("get notes in tag", () =>
  noteTest({
    ...TEST_NOTE,
    tags: ["new", "tag", "goes", "here"]
  }).then(async ({ db }) => {
    expect(db.getTag("tag")[0].tags.includes("tag")).toBe(true);
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

test("search all notebooks", () =>
  notebookTest({
    ...TEST_NOTEBOOK,
    title: "I will be searched.",
    description: "searched description"
  }).then(({ db }) => {
    let filtered = db.searchNotebooks("searhed");
    expect(filtered.length).toBeGreaterThan(0);
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
    expect(note.notebook.id).toBe(timestamp);
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
    await db.addTopicToNotebook(notebook1, "Home");
    await db.addNoteToTopic(notebook1, "Home", timestamp);
    setTimeout(async () => {
      let notebook2 = await db.addNotebook(TEST_NOTEBOOK2);
      await db.moveNotes(
        { id: notebook1, topic: "Home" },
        { id: notebook2, topic: "Home2" },
        timestamp
      );
      let note = db.getNote(timestamp);
      expect(note.notebook.id).toBe(notebook2);
    }, 1000);
  }));

test("deletion of note from invalid topic should return false", () =>
  noteTest().then(async ({ db, noteId = timestamp }) => {
    let timestamp = await db.addNotebook(TEST_NOTEBOOK);
    let res = await db.deleteNoteFromTopic(timestamp, "invalid_topic", noteId);
    expect(res).toBe(false);
  }));

test("delete note from topic", () =>
  topicNoteTest().then(async ({ db, timestamp, topic, noteTimestamp }) => {
    let notebook = db.getNotebook(timestamp);
    expect(await db.deleteNoteFromTopic(timestamp, topic, noteTimestamp)).toBe(
      true
    );
    notebook = db.getNotebook(timestamp);
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
    expect(await db.deleteNotes(timestamp)).toBe(true);
    let note = db.getNote(timestamp);
    expect(note).toBeUndefined();
  }));

test("deleting note that is in a notebook should delete it from the notebook", () =>
  topicNoteTest().then(async ({ db, timestamp, topic, noteTimestamp }) => {
    expect(await db.deleteNotes(noteTimestamp)).toBe(true);
    let notebook = db.getNotebook(timestamp);
    let topicIndex = notebook.topics.findIndex(t => t.title === topic);
    expect(notebook.topics[topicIndex].notes.includes(noteTimestamp)).toBe(
      false
    );
  }));

test("delete notebook", () =>
  notebookTest().then(async ({ db, timestamp }) => {
    expect(await db.deleteNotebooks(timestamp)).toBe(true);
    let notebook = db.getNotebook(timestamp);
    expect(notebook).toBeUndefined();
  }));

test("trash should not be empty", () =>
  notebookTest().then(async ({ db, timestamp }) => {
    expect(await db.deleteNotebooks(timestamp)).toBe(true);
    let trash = db.getTrash();
    expect(trash.length).toBeGreaterThan(0);
  }));

test("restore an item from trash", () =>
  notebookTest().then(async ({ db, timestamp }) => {
    expect(await db.deleteNotebooks(timestamp)).toBe(true);
    let trash = db.getTrash();
    expect(trash.length).toBeGreaterThan(0);
    await db.restoreItem(timestamp);
    let notebook = db.getNotebook(timestamp);
    expect(notebook.dateCreated).toBe(timestamp);
  }));

test("clear trash should clear the trash", () =>
  notebookTest().then(async ({ db, timestamp }) => {
    expect(await db.deleteNotebooks(timestamp)).toBe(true);
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

test("deletion of invalid items should cause continue and return true", () =>
  databaseTest().then(async db => {
    let res = await db.deleteNotes(null, null, "something");
    expect(res).toBe(true);
  }));

test("deletion of invalid topic from notebook should return false", () =>
  topicTest().then(async ({ db, timestamp }) => {
    let res = await db.deleteTopicFromNotebook(timestamp, "invalid_topic");
    expect(res).toBe(false);
  }));

test("moving note with wrong id should throw", () =>
  databaseTest().then(async db => {
    db.moveNotes(undefined, undefined, 0).catch(err =>
      expect(err.message).toContain("Failed to move note.")
    );
  }));

test("moving note to non-existent notebook should return false", () =>
  databaseTest().then(async db => {
    await db.moveNotes({ id: 2, topic: "2" }, { id: 5, topic: "123" }, 23);
  }));

test("moving note to same notebook should throw", () =>
  databaseTest().then(async db => {
    db.moveNotes({ id: 2, topic: "2" }, { id: 2, topic: "2" }, 23).catch(err =>
      expect(err.message).toContain(
        "Moving to the same notebook and topic is not possible."
      )
    );
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

test("Operations on uninitialized database should throw", () => {
  let db = new Database(StorageInterface);
  expect(db.getNotes.bind(db)).toThrowError("Database is not initialized.");
});

test("edit item with wrong id should throw", () =>
  databaseTest().then(async db => {
    db.pinNotebook(1242141).catch(err => {
      expect(err.message).toContain("Wrong notebook id");
    });
  }));

test("restoring an invalid item from trash should throw", () =>
  databaseTest().then(async db => {
    db.restoreItem(21412).catch(err =>
      expect(err.message).toContain("Cannot restore")
    );
  }));

test("get grouped notes by abc", () => groupedTest("abc"));

test("get grouped notes by abc (special)", () => groupedTest("abc", true));

test("get grouped notes by month", () => groupedTest("month"));

test("get grouped notes by month (special)", () => groupedTest("month", true));

test("get grouped notes by year", () => groupedTest("year"));

test("get grouped notes by year (special)", () => groupedTest("year", true));

test("get grouped notes by weak", () => groupedTest("week"));

test("get grouped notes by weak (special)", () => groupedTest("week", true));

test("get grouped notes default", () => groupedTest());

test("get grouped notes default (special)", () => groupedTest("", true));

test("pin note", () =>
  noteTest().then(async ({ db, timestamp }) => {
    await db.pinNote(timestamp);
    expect(db.getNote(timestamp).pinned).toBe(true);
  }));

test("pin notebook", () =>
  notebookTest().then(async ({ db, timestamp }) => {
    await db.pinNotebook(timestamp);
    expect(db.getNotebook(timestamp).pinned).toBe(true);
  }));

test("favorite note", () =>
  noteTest().then(async ({ db, timestamp }) => {
    await db.favoriteNotes(timestamp);
    expect(db.getNote(timestamp).favorite).toBe(true);
  }));

test("favorite notebook", () =>
  notebookTest().then(async ({ db, timestamp }) => {
    await db.favoriteNotebooks(timestamp);
    expect(db.getNotebook(timestamp).favorite).toBe(true);
  }));

test("lock and unlock note", () =>
  noteTest().then(async ({ db, timestamp }) => {
    expect(await db.lockNote(timestamp, "password123")).toBe(true);
    let note = db.getNote(timestamp);
    expect(note.locked).toBe(true);
    expect(note.content.iv).toBeDefined();
    note = await db.unlockNote(timestamp, "password123");
    expect(note.dateCreated).toBe(timestamp);
    expect(note.content.text).toBe(TEST_NOTE.content.text);
    await db.unlockNote(timestamp, "password123", true);
    note = db.getNote(timestamp);
    expect(note.locked).toBe(false);
  }));
