import Database from "../api/database";
import StorageInterface from "../../notes-web/src/interfaces/storage";

const db = new Database(StorageInterface);

const TEST_NOTE = {
  title: "I am a title",
  content: { delta: "I am a delta", text: "I am a text" }
};

test("storage is defined", () => {
  expect(db.storage).toBeDefined();
});

test("add a note", async () => {
  let timestamp = await db.addNote(TEST_NOTE);
  expect(timestamp).toBeGreaterThan(1574880904538);
});

test("save and get note", async () => {
  let timestamp = await db.addNote(TEST_NOTE);
  expect(timestamp).toBeGreaterThan(1574880904538);
  let note = db.getNote(timestamp);
  expect(note.title).toBe("I am a title");
});

test("add and update note", async () => {
  let timestamp = await db.addNote(TEST_NOTE);
  expect(timestamp).toBeGreaterThan(1574880904538);
  let updateTimestamp = await db.addNote({
    ...TEST_NOTE,
    title: "I am a new title",
    dateCreated: timestamp
  });
  expect(updateTimestamp).toBe(timestamp);
  let note = db.getNote(timestamp);
  let newNote = db.getNote(updateTimestamp);
  expect(note.title).toBe("I am a new title");
  expect(newNote.title).toBe("I am a new title");
});

test("delete note", async () => {
  let timestamp = await db.addNote(TEST_NOTE);
  let note = db.getNote(timestamp);
  expect(note.title).toBe("I am a title");
  await db.deleteNotes([note]);
  note = db.getNote(timestamp);
  expect(note).toBeUndefined();
});

test("get all notes", async () => {
  let notes = await db.getNotes();
  expect(notes.length).toBeGreaterThan(0);
});
