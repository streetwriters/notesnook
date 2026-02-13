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
  TEST_NOTE,
  loginFakeUser
} from "../../../../__tests__/utils/index.ts";
import Collector from "../collector.ts";
import { test, expect } from "vitest";

test("newly created note should get included in collector", () =>
  databaseTest().then(async (db) => {
    await loginFakeUser(db);
    const collector = new Collector(db);

    const noteId = await db.notes.add(TEST_NOTE);

    const items = await iteratorToArray(collector.collect(100, false));

    expect(items).toHaveLength(2);
    expect(items[0].type).toBe("content");
    expect(items[0].items[0].id).toBe((await db.notes.note(noteId)).contentId);
    expect(items[1].items[0].id).toBe(noteId);
    expect(items[1].type).toBe("note");
  }));

test("synced property should be true after getting collected by the collector", () =>
  databaseTest().then(async (db) => {
    await loginFakeUser(db);
    const collector = new Collector(db);

    const noteId = await db.notes.add(TEST_NOTE);

    const items = await iteratorToArray(collector.collect(100, false));
    const items2 = await iteratorToArray(collector.collect(100, false));

    expect(items2).toHaveLength(0);
    expect(items).toHaveLength(2);
    expect(items[0].type).toBe("content");
    expect(items[0].items[0].id).toBe((await db.notes.note(noteId)).contentId);
    expect(items[1].items[0].id).toBe(noteId);
    expect(items[1].type).toBe("note");
  }));

test("edited note should get included in collector", () =>
  databaseTest().then(async (db) => {
    await loginFakeUser(db);
    const collector = new Collector(db);
    const noteId = await db.notes.add(TEST_NOTE);

    await iteratorToArray(collector.collect(100, false));

    await db.notes.add({ id: noteId, pinned: true });

    const items = await iteratorToArray(collector.collect(100, false));

    expect(items).toHaveLength(1);
    expect(items[0].items[0].id).toBe(noteId);
  }));

test("localOnly note should get included as a deleted item in collector", () =>
  databaseTest().then(async (db) => {
    await loginFakeUser(db);
    const collector = new Collector(db);
    await db.notes.add({ ...TEST_NOTE, localOnly: true });

    const items = await iteratorToArray(collector.collect(100, false));

    expect(items).toHaveLength(2);
    expect(items[0].items[0].length).toBe(77);
    expect(items[1].items[0].length).toBe(77);
    expect(items[0].type).toBe("content");
    expect(items[1].type).toBe("note");
  }));

test("unlinked relation should get included in collector", () =>
  databaseTest().then(async (db) => {
    await loginFakeUser(db);
    const collector = new Collector(db);
    await db.relations.add(
      { id: "h", type: "note" },
      { id: "h", type: "attachment" }
    );

    await iteratorToArray(collector.collect(100, false));

    await db.relations.from({ id: "h", type: "note" }, "attachment").unlink();

    const items = await iteratorToArray(collector.collect(100, false));

    expect(items).toHaveLength(1);
    expect(items[0].items[0].id).toBe("cd93df7a4c64fbd5f100361d629ac5b5");
  }));

test("collector should use latest key version for encryption", () =>
  databaseTest().then(async (db) => {
    await loginFakeUser(db);
    const collector = new Collector(db);

    const noteId = await db.notes.add(TEST_NOTE);

    const items = await iteratorToArray(collector.collect(100, false));

    // Find the note item
    const noteItem = items.find((i) => i.type === "note");
    expect(noteItem).toBeDefined();
    expect(noteItem.items[0].keyVersion).toBeDefined();

    // Should use the latest key version available
    const keys = await db.user.getDataEncryptionKeys();
    const latestKeyVersion = Math.max(...keys.map((k) => k.version));
    expect(noteItem.items[0].keyVersion).toBe(latestKeyVersion);
  }));

test("collector should assign keyVersion to all encrypted items", () =>
  databaseTest().then(async (db) => {
    await loginFakeUser(db);
    const collector = new Collector(db);

    await db.notes.add(TEST_NOTE);
    await db.notes.add({ ...TEST_NOTE, title: "Note 2" });
    await db.notes.add({ ...TEST_NOTE, title: "Note 3" });

    const items = await iteratorToArray(collector.collect(100, false));

    // All items should have keyVersion set
    for (const chunk of items) {
      for (const item of chunk.items) {
        expect(item.keyVersion).toBeDefined();
        expect(typeof item.keyVersion).toBe("number");
      }
    }
  }));

test("sync roundtrip: items encrypted with keyVersion can be decrypted", () =>
  databaseTest().then(async (db) => {
    await loginFakeUser(db);
    const { Sync } = await import("../index.ts");
    const sync = new Sync(db);
    const collector = new Collector(db);

    const noteId = await db.notes.add({
      ...TEST_NOTE,
      title: "Sync Test Note"
    });
    const note = await db.notes.note(noteId);

    const items = await iteratorToArray(collector.collect(100, false));
    const noteChunk = items.find((i) => i.type === "note");

    expect(noteChunk).toBeDefined();
    expect(noteChunk.items[0].keyVersion).toBeDefined();

    // Simulate receiving the same item back from server
    const keys = await db.user.getDataEncryptionKeys();
    await sync.processChunk(noteChunk, keys, { type: "fetch" });

    // Verify the note is still intact
    const syncedNote = await db.notes.note(noteId);
    expect(syncedNote.title).toBe("Sync Test Note");
    expect(syncedNote.id).toBe(note.id);
  }));

test("sync should handle mixed keyVersion items in same chunk", () =>
  databaseTest().then(async (db) => {
    await loginFakeUser(db);
    const { Sync } = await import("../index.ts");
    const sync = new Sync(db);

    const keys = await db.user.getDataEncryptionKeys();

    // Create mock items with different key versions
    const note1 = JSON.stringify({
      id: "note1",
      type: "note",
      title: "Note 1",
      dateModified: Date.now()
    });
    const note2 = JSON.stringify({
      id: "note2",
      type: "note",
      title: "Note 2",
      dateModified: Date.now()
    });

    const cipher1 = await db.storage().encrypt(keys[0].key, note1);
    const cipher2 =
      keys.length > 1
        ? await db.storage().encrypt(keys[1].key, note2)
        : await db.storage().encrypt(keys[0].key, note2);

    const chunk = {
      type: "note",
      count: 2,
      items: [
        { ...cipher1, id: "note1", v: 5, keyVersion: keys[0].version },
        {
          ...cipher2,
          id: "note2",
          v: 5,
          keyVersion: keys.length > 1 ? keys[1].version : keys[0].version
        }
      ]
    };

    // Process the chunk with mixed key versions
    await sync.processChunk(chunk, keys, { type: "fetch" });

    // Verify both notes were decrypted correctly
    const savedNote1 = await db.notes.note("note1");
    const savedNote2 = await db.notes.note("note2");

    expect(savedNote1).toBeDefined();
    expect(savedNote2).toBeDefined();
    expect(savedNote1.title).toBe("Note 1");
    expect(savedNote2.title).toBe("Note 2");
  }));

test("sync should maintain stable ordering across decryptMulti", () =>
  databaseTest().then(async (db) => {
    await loginFakeUser(db);
    const collector = new Collector(db);

    // Create multiple notes with predictable order
    const noteIds = [];
    for (let i = 0; i < 5; i++) {
      const id = await db.notes.add({
        ...TEST_NOTE,
        title: `Note ${i}`
      });
      noteIds.push(id);
    }

    const items = await iteratorToArray(collector.collect(100, false));
    const noteChunk = items.find((i) => i.type === "note");

    expect(noteChunk).toBeDefined();
    expect(noteChunk.items).toHaveLength(5);

    // Verify all items have IDs
    const collectedIds = noteChunk.items.map((item) => item.id);
    expect(collectedIds).toHaveLength(5);

    // All IDs should be present
    for (const id of noteIds) {
      expect(collectedIds).toContain(id);
    }

    // Decrypt and verify ID mapping is preserved
    const keys = await db.user.getDataEncryptionKeys();
    const { Sync } = await import("../index.ts");
    const sync = new Sync(db);

    await sync.processChunk(noteChunk, keys, { type: "fetch" });

    // Verify each note can be retrieved with correct content
    for (let i = 0; i < 5; i++) {
      const note = await db.notes.note(noteIds[i]);
      expect(note).toBeDefined();
      expect(note.title).toBe(`Note ${i}`);
    }
  }));

test("sync should correctly select key based on keyVersion", () =>
  databaseTest().then(async (db) => {
    await loginFakeUser(db);
    const { Sync } = await import("../index.ts");
    const sync = new Sync(db);

    const keys = await db.user.getDataEncryptionKeys();

    // Create items encrypted with specific key versions
    const testCases = keys.map((keyInfo, idx) => ({
      id: `note${idx}`,
      title: `Note with keyVersion ${keyInfo.version}`,
      keyVersion: keyInfo.version,
      key: keyInfo.key
    }));

    const chunks = [];
    for (const testCase of testCases) {
      const noteData = JSON.stringify({
        id: testCase.id,
        type: "note",
        title: testCase.title,
        dateModified: Date.now()
      });
      const cipher = await db.storage().encrypt(testCase.key, noteData);

      chunks.push({
        type: "note",
        count: 1,
        items: [
          { ...cipher, id: testCase.id, v: 5, keyVersion: testCase.keyVersion }
        ]
      });
    }

    // Process each chunk
    for (const chunk of chunks) {
      await sync.processChunk(chunk, keys, { type: "fetch" });
    }

    // Verify each note was decrypted with the correct key
    for (const testCase of testCases) {
      const note = await db.notes.note(testCase.id);
      expect(note).toBeDefined();
      expect(note.title).toBe(testCase.title);
    }
  }));

async function iteratorToArray(iterator) {
  let items = [];
  for await (const item of iterator) {
    items.push(item);
  }
  return items;
}
