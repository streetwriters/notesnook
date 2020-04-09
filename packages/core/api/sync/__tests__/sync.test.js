//import User from "../../models/user";
import { enableFetchMocks, disableFetchMocks } from "jest-fetch-mock";
import StorageInterface from "../../../__mocks__/storage.mock";
//import Sync from "../sync";
//import Prepare from "../prepare";
import { databaseTest, TEST_NOTE } from "../../../__tests__/utils";

const SUCCESS_LOGIN_RESPONSE = {
  access_token: "access_token",
  refresh_token: "refresh_token",
  payload: {
    username: "thecodrr",
    email: process.env.EMAIL,
    lastSynced: 0,
  },
  scopes: "sync",
  expiry: 36000,
};

beforeAll(() => {
  enableFetchMocks();
});

beforeEach(() => {
  fetch.resetMocks();
  StorageInterface.clear();
});

test("syncing when user is not logged in should throw", () =>
  databaseTest().then((db) => {
    expect(db.sync()).rejects.toThrow("You need to login to sync.");
  }));

test("sync without merge conflicts, cause merge conflicts, resolve them and then resync", () => {
  return databaseTest().then(async (db) => {
    // 1. login
    fetchMock.mockResponseOnce(JSON.stringify(SUCCESS_LOGIN_RESPONSE));
    await db.user.login("username", "password");

    // 2. create local note
    const noteId = await db.notes.add(TEST_NOTE);

    // 3. start sync
    fetchMock
      .once(JSON.stringify({ notes: [], synced: false }))
      .once(JSON.stringify({}), { status: 200 });
    await db.sync();

    const user = await db.user.get();
    expect(user.lastSynced).toBeGreaterThan(0);

    /////// CAUSE MERGE CONFLICT! ///////
    // 4. edit the note's content
    await db.notes.add({
      id: noteId,
      content: { text: "i am a text", delta: { ops: [{ insert: "text" }] } },
    });

    // 5. sync again and expect conflicts
    const deltaId = db.notes.note(noteId).data.content.delta;
    const delta = {
      id: deltaId,
      data: JSON.stringify({
        id: deltaId,
        dateEdited: Date.now(),
        conflicted: false,
        data: { ops: [{ insert: "text" }] },
      }),
    };

    fetchMock
      .once(JSON.stringify({ notes: [], delta: [delta], synced: false }))
      .once(JSON.stringify({}), { status: 200 });

    await expect(db.sync()).rejects.toThrow(
      "Merge conflicts detected. Please resolve all conflicts to continue syncing."
    );

    let rawDelta = await db.delta.raw(deltaId);
    expect(rawDelta.conflicted.id).toBe(deltaId);
    expect(rawDelta.conflicted.data).toBeTruthy();

    // 6. Resolve conflicts
    await db.notes.add({
      id: noteId,
      conflicted: false,
      content: {
        text: "i am a text",
        delta: { data: { ops: [{ insert: "text" }] }, resolved: true },
      },
    });
    rawDelta = await db.delta.raw(deltaId);
    expect(rawDelta.conflicted).toBe(false);
    //expect(rawDelta.resolved).toBe(true);

    // 7. Resync (no conflicts should appear)
    fetchMock
      .once(JSON.stringify({ notes: [], delta: [delta], synced: false }))
      .once(JSON.stringify({}), { status: 200 });
    await expect(db.sync()).resolves.toBeUndefined();
  });
});
