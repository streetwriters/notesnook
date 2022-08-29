import {
  databaseTest,
  TEST_NOTE,
  delay,
  StorageInterface,
} from "../../../__tests__/utils";
import Collector from "../collector";

beforeEach(async () => {
  StorageInterface.clear();
});

test("newly created note should get included in collector", () =>
  databaseTest().then(async (db) => {
    const collector = new Collector(db);

    const lastSyncedTime = Date.now() - 10000;

    const noteId = await db.notes.add(TEST_NOTE);

    const data = await collector.collect(lastSyncedTime);
    const notes = data.items.filter((i) => i.collectionId === "note");

    expect(notes).toHaveLength(1);
    expect(notes[0].id).toBe(noteId);
  }));

test("edited note after last synced time should get included in collector", () =>
  databaseTest().then(async (db) => {
    const collector = new Collector(db);
    const noteId = await db.notes.add(TEST_NOTE);

    const lastSyncedTime = Date.now();

    await delay(1000);

    await db.notes.add({ id: noteId, pinned: true });

    const data = await collector.collect(lastSyncedTime);
    const notes = data.items.filter((i) => i.collectionId === "note");

    expect(notes).toHaveLength(1);
    expect(notes[0].id).toBe(noteId);
  }));

test("note edited before last synced time should not get included in collector", () =>
  databaseTest().then(async (db) => {
    const collector = new Collector(db);
    const noteId = await db.notes.add(TEST_NOTE);

    await db.notes.add({ id: noteId, pinned: true });

    await delay(500);

    const lastSyncedTime = Date.now();

    const data = await collector.collect(lastSyncedTime);
    const notes = data.items.filter((i) => i.collectionId === "note");

    expect(notes).toHaveLength(0);
  }));

test("localOnly note should get included as a deleted item in collector", () =>
  databaseTest().then(async (db) => {
    const collector = new Collector(db);
    await db.notes.add({ ...TEST_NOTE, localOnly: true });

    const data = await collector.collect(0);
    const notes = data.items.filter((i) => i.collectionId === "note");
    expect(notes).toHaveLength(1);
    expect(notes[0].deleted).toBe(true);
  }));
