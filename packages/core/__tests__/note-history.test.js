import { compress, decompress } from "../utils/compression";
import { databaseTest, noteTest, StorageInterface, TEST_NOTE } from "./utils";

beforeEach(async () => {
  StorageInterface.clear();
});

async function sessionTest(db, noteId) {
  let note = await db.notes.note(noteId).data;
  let content = {
    data: await db.notes.note(noteId).content(),
    type: "tiny",
  };
  let session = await db.noteHistory.add(noteId, note.dateEdited, content);

  return session;
}

test("History of note should be created", async () => {
  let { db, id } = await noteTest();
  let session = await sessionTest(db, id);
  let content = {
    data: await db.notes.note(id).content(),
    type: "tiny",
  };

  let sessionContent = await db.noteHistory.content(session.sessionContentId);
  expect(sessionContent).toMatchObject(content);
});

test("Multiple sessions of the same note should be created", async () => {
  let { db, id } = await noteTest();
  await sessionTest(db, id);

  let nextContent = {
    data: (await db.notes.note(id).content().data) + "teststring",
    type: "tiny",
  };

  await db.notes.add({
    id: id,
    content: nextContent,
  });
  let note = db.notes.note(id).data;
  await db.noteHistory.add(id, note.dateEdited, nextContent);

  let history = await db.noteHistory.get(id);
  expect(history.length).toBe(2);
});

test("Session should be removed if greater than the version limit", async () => {
  let { db, id } = await noteTest();
  await sessionTest(db, id);

  let nextContent = {
    data: (await db.notes.note(id).content().data) + "teststring",
    type: "tiny",
  };

  await db.notes.add({
    id: id,
    content: nextContent,
  });
  let note = db.notes.note(id).data;
  await db.noteHistory.add(id, note.dateEdited, nextContent);

  let history = await db.noteHistory.get(id);
  expect(history.length).toBe(2);
  await db.noteHistory._cleanup(id, 1);
  history = await db.noteHistory.get(id);
  expect(history.length).toBe(1);
  let content = await db.noteHistory.content(history[0].sessionContentId);
  expect(content.data).toBe(nextContent.data);
});

test("Session should update if a sessionId is same", async () => {
  let { db, id } = await noteTest();
  await sessionTest(db, id);
  let content = {
    data: await db.notes.note(id).content(),
    type: "tiny",
  };
  let note = db.notes.note(id).data;
  let nextContent = {
    data: content.data + "teststring",
    type: "tiny",
  };

  await db.notes.add({
    id: id,
    content: nextContent,
  });
  let session = await db.noteHistory.add(id, note.dateEdited, nextContent);
  let history = await db.noteHistory.get(id);
  expect(history.length).toBe(1);

  let sessionContent = await db.noteHistory.content(session.sessionContentId);
  expect(sessionContent.data).toBe(nextContent.data);
});

test("History of note should be restored", async () => {
  let { db, id } = await noteTest();
  let session = await sessionTest(db, id);
  let prevContent = {
    data: await db.notes.note(id).content(),
    type: "tiny",
  };

  await db.notes.add({
    id: id,
    content: {
      data: "<p></p>",
      type: "tiny",
    },
  });
  await db.noteHistory.restore(session.id);
  let nextContent = await db.notes.note(id).content();
  expect(nextContent).toBe(prevContent.data);
});

test("Session should not be created if values are falsy", async () => {
  let db = await databaseTest();
  let session = await db.noteHistory.add(null, null, null);
  expect(session).toBeFalsy();
});

test("Should return empty array if no history available", async () => {
  let { db, id } = await noteTest();
  let history = await db.noteHistory.get(id);
  expect(history.length).toBe(0);
});

test("Session history of a given sessionId should be removed", async () => {
  let { db, id } = await noteTest();
  let session = await sessionTest(db, id);
  await db.noteHistory.removeSession(session.id);
  let history = await db.noteHistory.get(id);
  expect(history.length).toBe(0);
});

test("All sessions of a note should be cleared", async () => {
  let { db, id } = await noteTest();
  await sessionTest(db, id);

  await db.noteHistory.clearSessions(id);

  let history = await db.noteHistory.get(id);
  expect(history.length).toBe(0);
});

test("Sessions should be serialized and deserialized", async () => {
  let { db, id } = await noteTest();
  await sessionTest(db, id);
  let json = await db.noteHistory.serialize();
  await db.noteHistory.clearSessions(id);
  await db.noteHistory.deserialize(json);

  let history = await db.noteHistory.get(id);
  expect(history.length).toBe(1);
  let content = await db.noteHistory.content(history[0].id);
  expect(content).toBeTruthy();
});

test("String should compress and decompress", () => {
  let compressed = compress(TEST_NOTE.content.data);
  let decompressed = decompress(compressed);
  expect(decompressed).toBe(TEST_NOTE.content.data);
});
