import { databaseTest, TEST_NOTE, delay } from "../../../__tests__/utils";

test("newly created note should get included in collector", () =>
  databaseTest().then(async (db) => {
    const lastSyncedTime = Date.now() - 10000;

    const noteId = await db.notes.add(TEST_NOTE);

    const data = await db.syncer._collector.collect(lastSyncedTime);

    expect(data.notes.length).toBe(1);
    expect(data.notes[0].id).toBe(noteId);
  }));

test("edited note after last synced time should get included in collector", () =>
  databaseTest().then(async (db) => {
    const noteId = await db.notes.add(TEST_NOTE);

    const lastSyncedTime = Date.now();

    await delay(1000);

    await db.notes.add({ id: noteId, pinned: true });

    const data = await db.syncer._collector.collect(lastSyncedTime);

    expect(data.notes.length).toBe(1);
    expect(data.notes[0].id).toBe(noteId);
  }));

test("note edited before last synced time should not get included in collector", () =>
  databaseTest().then(async (db) => {
    const noteId = await db.notes.add(TEST_NOTE);

    await db.notes.add({ id: noteId, pinned: true });

    await delay(500);

    const lastSyncedTime = Date.now();

    const data = await db.syncer._collector.collect(lastSyncedTime);

    expect(data.notes.length).toBe(0);
  }));

test("localOnly note should not get included in collector", () =>
  databaseTest().then(async (db) => {
    await db.notes.add({ ...TEST_NOTE, localOnly: true });

    const data = await db.syncer._collector.collect(0);

    expect(data.notes.length).toBe(0);
  }));
