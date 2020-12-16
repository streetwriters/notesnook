//import User from "../../models/user";
import { enableFetchMocks, disableFetchMocks } from "jest-fetch-mock";
import { CURRENT_DATABASE_VERSION } from "../../../common";
import StorageInterface from "../../../__mocks__/storage.mock";
//import Sync from "../sync";
//import Collector from "../prepare";
import { databaseTest, TEST_NOTE } from "../../../__tests__/utils";
import { login, getEncrypted } from "./utils";

const RESPONSE_PARAMS = {
  headers: { "Content-Type": "application/json" },
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
    await login(db);

    // 2. create local note
    const noteId = await db.notes.add(TEST_NOTE);

    // 3. start sync
    fetchMock
      .once(JSON.stringify({ notes: [], synced: false }), RESPONSE_PARAMS)
      .once(
        JSON.stringify({ lastSynced: Date.now() }),
        { status: 200 },
        RESPONSE_PARAMS
      );
    await db.sync();

    /////// CAUSE MERGE CONFLICT! ///////
    // 4. edit the note's content
    await db.notes.add({
      id: noteId,
      content: { type: "delta", data: [{ insert: "text" }] },
    });

    // 5. sync again and expect conflicts
    const contentId = db.notes.note(noteId).data.contentId;
    const content = {
      id: contentId,
      v: CURRENT_DATABASE_VERSION,
      ...(await getEncrypted({
        id: contentId,
        type: "delta",
        dateEdited: Date.now(),
        conflicted: false,
        data: [{ insert: "text" }],
      })),
    };

    fetchMock
      .once(
        JSON.stringify({ notes: [], content: [content], synced: false }),
        RESPONSE_PARAMS
      )
      .once(
        JSON.stringify({ lastSynced: Date.now() }),
        { status: 200 },
        RESPONSE_PARAMS
      );

    await expect(db.sync()).rejects.toThrow(
      "Merge conflicts detected. Please resolve all conflicts to continue syncing."
    );

    let rawContent = await db.content.raw(contentId);
    expect(rawContent.conflicted.id).toBe(contentId);
    expect(rawContent.conflicted.data).toBeTruthy();

    // 6. Resolve conflicts
    await db.notes.add({
      id: noteId,
      conflicted: false,
      content: {
        type: "delta",
        data: [{ insert: "text" }],
        resolved: true,
      },
    });
    rawContent = await db.content.raw(contentId);
    expect(rawContent.conflicted).toBe(false);
    //expect(rawDelta.resolved).toBe(true);

    // 7. Resync (no conflicts should appear)
    fetchMock
      .once(
        JSON.stringify({ notes: [], content: [content], synced: false }),
        RESPONSE_PARAMS
      )
      .once(
        JSON.stringify({ lastSynced: Date.now() }),
        { status: 200 },
        RESPONSE_PARAMS
      );
    await expect(db.sync()).resolves.toBeUndefined();
  });
});
