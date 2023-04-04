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
  delay,
  StorageInterface
} from "../../../../__tests__/utils";
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

    expect(data.items).toHaveLength(2);
    expect(data.items[0].type).toBe("note");
    expect(data.items[0].id).toBe(noteId);
    expect(data.types[0]).toBe("note");
    expect(data.types[1]).toBe("content");
    expect(data.items[1].type).toBe("tiptap");
  }));

test("edited note after last synced time should get included in collector", () =>
  databaseTest().then(async (db) => {
    const collector = new Collector(db);
    const noteId = await db.notes.add(TEST_NOTE);

    const lastSyncedTime = Date.now();

    await delay(1000);

    await db.notes.add({ id: noteId, pinned: true });

    const data = await collector.collect(lastSyncedTime);

    expect(data.items).toHaveLength(1);
    expect(data.items[0].id).toBe(noteId);
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
    expect(data.items).toHaveLength(2);
    expect(data.items[0].deleted).toBe(true);
    expect(data.items[1].deleted).toBe(true);
    expect(data.types[0]).toBe("note");
    expect(data.types[1]).toBe("content");
  }));
