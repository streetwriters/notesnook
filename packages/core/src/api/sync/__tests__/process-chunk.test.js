/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import {
  databaseTest,
  loginFakeUser,
  TEST_NOTE
} from "../../../../__tests__/utils/index.ts";
import { KEY_VERSION } from "../types.ts";
import { test, expect, vi } from "vitest";

const CURRENT_DATABASE_VERSION = 6.1;

function chunkItem(id, keyVersion) {
  return {
    id,
    v: CURRENT_DATABASE_VERSION,
    keyVersion,
    format: "base64",
    alg: "xchacha20-poly1305",
    cipher: "ciphertext",
    iv: "iv",
    salt: "salt",
    length: 1
  };
}

function decryptFailure() {
  return Promise.reject(
    new Error("ciphertext cannot be decrypted using that key")
  );
}

function failedItemPayload(itemId, itemType) {
  return {
    itemId,
    itemType,
    cipher: chunkItem(itemId, KEY_VERSION.LEGACY),
    errors: [`Failed to decrypt item ${itemId} with key version 0.`],
    dateSynced: Date.now()
  };
}

test("items with a key version that has no matching key are stored in failedSyncItems", () =>
  databaseTest().then(async (db) => {
    await loginFakeUser(db);

    const item = chunkItem("setting-1", KEY_VERSION.DEK);
    const keys = [{ version: KEY_VERSION.LEGACY, key: { key: "legacy-key" } }];

    // decryptMulti is never called for the DEK version group (no matching key),
    // so only the per-item retry path runs. Make all retries fail.
    vi.spyOn(db.storage(), "decrypt").mockImplementation(decryptFailure);

    await db.syncer.sync.processChunk(
      { type: "settingitem", count: 1, items: [item] },
      keys,
      { type: "fetch" }
    );

    const failedItems = await db.failedSyncItems.all.items();
    expect(failedItems).toHaveLength(1);
    expect(failedItems[0].itemId).toBe(item.id);
    expect(failedItems[0].itemType).toBe("settingitem");
    expect(failedItems[0].cipher.id).toBe(item.id);
    expect(failedItems[0].errors.length).toBe(keys.length);
    expect(failedItems[0].errors[0]).toContain(
      "ciphertext cannot be decrypted"
    );
  }));

test("items that fail to decrypt with all available keys are stored in failedSyncItems", () =>
  databaseTest().then(async (db) => {
    await loginFakeUser(db);

    const item = chunkItem("setting-1", KEY_VERSION.LEGACY);
    const keys = [
      { version: KEY_VERSION.LEGACY, key: { key: "legacy-key" } },
      { version: KEY_VERSION.DEK, key: { key: "dek-key" } }
    ];

    vi.spyOn(db.storage(), "decryptMulti").mockImplementation(decryptFailure);
    vi.spyOn(db.storage(), "decrypt").mockImplementation(decryptFailure);

    await db.syncer.sync.processChunk(
      { type: "settingitem", count: 1, items: [item] },
      keys,
      { type: "fetch" }
    );

    const failedItems = await db.failedSyncItems.all.items();
    expect(failedItems).toHaveLength(1);
    expect(failedItems[0].errors.length).toBe(keys.length);
    expect(failedItems[0].errors[0]).toContain("key version 0");
    expect(failedItems[0].errors[1]).toContain("key version 1");
  }));

test("items that fail batch decryption but succeed on a fallback key are decrypted and not stored as failed", () =>
  databaseTest().then(async (db) => {
    await loginFakeUser(db);

    const item = chunkItem("setting-1", KEY_VERSION.DEK);
    const keys = [
      { version: KEY_VERSION.LEGACY, key: { key: "legacy-key" } },
      { version: KEY_VERSION.DEK, key: { key: "dek-key" } }
    ];

    // Batch decryption with the DEK key fails...
    vi.spyOn(db.storage(), "decryptMulti").mockImplementation(decryptFailure);
    // ...but the per-item retry succeeds with the legacy key.
    const decryptedItem = JSON.stringify({
      id: item.id,
      type: "settingitem",
      deleted: true,
      dateCreated: Date.now(),
      dateModified: Date.now()
    });
    vi.spyOn(db.storage(), "decrypt").mockImplementation((key) =>
      key === keys[0].key ? Promise.resolve(decryptedItem) : decryptFailure()
    );

    await db.syncer.sync.processChunk(
      { type: "settingitem", count: 1, items: [item] },
      keys,
      { type: "fetch" }
    );

    const failedItems = await db.failedSyncItems.all.items();
    expect(failedItems).toHaveLength(0);
    expect(db.storage().decrypt).toHaveBeenCalledTimes(1);
  }));

test("successfully decrypted items are not stored in failedSyncItems", () =>
  databaseTest().then(async (db) => {
    await loginFakeUser(db);

    const item = chunkItem("setting-1", KEY_VERSION.LEGACY);
    const keys = [{ version: KEY_VERSION.LEGACY, key: { key: "legacy-key" } }];

    const decryptedItem = JSON.stringify({
      id: item.id,
      type: "settingitem",
      deleted: true,
      dateCreated: Date.now(),
      dateModified: Date.now()
    });
    vi.spyOn(db.storage(), "decryptMulti").mockResolvedValue([decryptedItem]);

    await db.syncer.sync.processChunk(
      { type: "settingitem", count: 1, items: [item] },
      keys,
      { type: "fetch" }
    );

    const failedItems = await db.failedSyncItems.all.items();
    expect(failedItems).toHaveLength(0);
  }));

test("failedSyncItems.add stores an item and assigns it a new id", () =>
  databaseTest().then(async (db) => {
    await loginFakeUser(db);

    const itemId = await db.notes.add(TEST_NOTE);
    const id = await db.failedSyncItems.add(failedItemPayload(itemId, "note"));

    expect(id).toBeDefined();
    expect(id).not.toBe(itemId);

    const items = await db.failedSyncItems.all.items();
    expect(items).toHaveLength(1);
    expect(items[0].itemId).toBe(itemId);
    expect(items[0].itemType).toBe("note");
    expect(items[0].cipher.id).toBe(itemId);
    expect(items[0].errors).toEqual([
      `Failed to decrypt item ${itemId} with key version 0.`
    ]);
  }));

test("failedSyncItems.delete removes the failed item and soft-deletes the underlying item", () =>
  databaseTest().then(async (db) => {
    await loginFakeUser(db);

    const noteId = await db.notes.add(TEST_NOTE);
    const failedId = await db.failedSyncItems.add(
      failedItemPayload(noteId, "note")
    );

    await db.failedSyncItems.delete([failedId]);

    const failedItems = await db.failedSyncItems.all.items();
    expect(failedItems).toHaveLength(0);
    expect(await isItemDeleted(db, "notes", noteId)).toBe(true);
  }));

test("failedSyncItems.delete groups items by type and soft-deletes in the right collections", () =>
  databaseTest().then(async (db) => {
    await loginFakeUser(db);

    const noteId = await db.notes.add(TEST_NOTE);
    const tagId = await db.tags.add({ title: "test-tag" });
    const failedNoteId = await db.failedSyncItems.add(
      failedItemPayload(noteId, "note")
    );
    const failedTagId = await db.failedSyncItems.add(
      failedItemPayload(tagId, "tag")
    );

    await db.failedSyncItems.delete([failedNoteId, failedTagId]);

    expect(await db.failedSyncItems.all.items()).toHaveLength(0);
    expect(await isItemDeleted(db, "notes", noteId)).toBe(true);
    expect(await isItemDeleted(db, "tags", tagId)).toBe(true);
  }));

test("failedSyncItems.delete only deletes the requested ids", () =>
  databaseTest().then(async (db) => {
    await loginFakeUser(db);

    const noteId1 = await db.notes.add(TEST_NOTE);
    const noteId2 = await db.notes.add(TEST_NOTE);
    const failedId1 = await db.failedSyncItems.add(
      failedItemPayload(noteId1, "note")
    );
    await db.failedSyncItems.add(failedItemPayload(noteId2, "note"));

    await db.failedSyncItems.delete([failedId1]);

    const failedItems = await db.failedSyncItems.all.items();
    expect(failedItems).toHaveLength(1);
    expect(failedItems[0].itemId).toBe(noteId2);
    expect(await isItemDeleted(db, "notes", noteId1)).toBe(true);
    expect(await db.notes.collection.get(noteId2)).toBeDefined();
  }));

test("failedSyncItems.delete skips unknown collection types gracefully", () =>
  databaseTest().then(async (db) => {
    await loginFakeUser(db);

    const failedId = await db.failedSyncItems.add(
      failedItemPayload("unknown-id", "unknown-type")
    );

    // Unknown type has no entry in SYNC_COLLECTIONS_MAP so it's skipped
    // gracefully; the failed item row itself is still removed.
    await expect(db.failedSyncItems.delete([failedId])).resolves.not.toThrow();
    expect(await db.failedSyncItems.all.items()).toHaveLength(0);
  }));

test("failedSyncItems.clear removes all failed items", () =>
  databaseTest().then(async (db) => {
    await loginFakeUser(db);

    const noteId1 = await db.notes.add(TEST_NOTE);
    const noteId2 = await db.notes.add(TEST_NOTE);
    await db.failedSyncItems.add(failedItemPayload(noteId1, "note"));
    await db.failedSyncItems.add(failedItemPayload(noteId2, "note"));

    await db.failedSyncItems.clear();

    expect(await db.failedSyncItems.all.items()).toHaveLength(0);
    expect(await isItemDeleted(db, "notes", noteId1)).toBeTruthy();
    expect(await isItemDeleted(db, "notes", noteId2)).toBeTruthy();
  }));

test("failedSyncItems.remove deletes the failed row without soft-deleting the underlying item", () =>
  databaseTest().then(async (db) => {
    await loginFakeUser(db);

    const noteId = await db.notes.add(TEST_NOTE);
    const failedId = await db.failedSyncItems.add(
      failedItemPayload(noteId, "note")
    );

    await db.failedSyncItems.remove([failedId]);

    expect(await db.failedSyncItems.all.items()).toHaveLength(0);
    expect(await isItemDeleted(db, "notes", noteId)).toBe(false);
    expect(await db.notes.note(noteId)).toBeDefined();
  }));

test("retryFailedItems decrypts with a custom key, merges the item, and removes the failed row", () =>
  databaseTest().then(async (db) => {
    await loginFakeUser(db);

    const keys = await db.user.getDataEncryptionKeys();
    const key = keys[0].key;
    const notePayload = {
      id: "retry-note-1",
      type: "note",
      title: "Recovered Note",
      dateModified: Date.now(),
      dateCreated: Date.now()
    };
    const cipher = await db.storage().encrypt(key, JSON.stringify(notePayload));
    const failedId = await db.failedSyncItems.add({
      itemId: notePayload.id,
      itemType: "note",
      cipher: {
        ...cipher,
        id: notePayload.id,
        v: CURRENT_DATABASE_VERSION,
        keyVersion: keys[0].version
      },
      errors: ["previous failure"],
      dateSynced: Date.now()
    });

    const result = await db.syncer.sync.retryFailedItems([failedId], key);

    expect(result.succeeded).toEqual([failedId]);
    expect(result.failed).toHaveLength(0);
    expect(await db.failedSyncItems.all.items()).toHaveLength(0);

    const note = await db.notes.note(notePayload.id);
    expect(note).toBeDefined();
    expect(note.title).toBe("Recovered Note");
  }));

test("retryFailedItems records a failure and keeps the failed row when the key is wrong", () =>
  databaseTest().then(async (db) => {
    await loginFakeUser(db);

    const keys = await db.user.getDataEncryptionKeys();
    const key = keys[0].key;
    const wrongKey = await db.crypto().generateRandomKey();
    const notePayload = {
      id: "retry-note-2",
      type: "note",
      title: "Still Locked",
      dateModified: Date.now(),
      dateCreated: Date.now()
    };
    const cipher = await db.storage().encrypt(key, JSON.stringify(notePayload));
    const failedId = await db.failedSyncItems.add({
      itemId: notePayload.id,
      itemType: "note",
      cipher: {
        ...cipher,
        id: notePayload.id,
        v: CURRENT_DATABASE_VERSION,
        keyVersion: keys[0].version
      },
      errors: ["previous failure"],
      dateSynced: Date.now()
    });

    const result = await db.syncer.sync.retryFailedItems([failedId], wrongKey);

    expect(result.succeeded).toHaveLength(0);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].id).toBe(failedId);

    const failedItems = await db.failedSyncItems.all.items();
    expect(failedItems).toHaveLength(1);
    expect(failedItems[0].errors.length).toBeGreaterThan(1);
    expect(await db.notes.note(notePayload.id)).toBeUndefined();
  }));

async function isItemDeleted(db, collectionName, itemId) {
  const item = await db
    .sql()
    .selectFrom(collectionName)
    .selectAll()
    .where("id", "==", itemId)
    .executeTakeFirst();
  return item?.deleted === true;
}
