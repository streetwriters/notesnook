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
  loginFakeUser
} from "../../../../__tests__/utils";
import Collector from "../collector";
import { test, expect } from "vitest";

test.only("newly created note should get included in collector", () =>
  databaseTest().then(async (db) => {
    await loginFakeUser(db);
    const collector = new Collector(db);

    const lastSyncedTime = Date.now() - 10000;

    const noteId = await db.notes.add(TEST_NOTE);

    const items = [];
    for await (const item of collector.collect(100, lastSyncedTime, false)) {
      items.push(item);
    }

    expect(items).toHaveLength(2);
    expect(items[0].type).toBe("content");
    expect(items[0].items[0].id).toBe(db.notes.note(noteId).data.contentId);
    expect(items[1].items[0].id).toBe(noteId);
    expect(items[1].type).toBe("note");
  }));

test("edited note after last synced time should get included in collector", () =>
  databaseTest().then(async (db) => {
    await loginFakeUser(db);
    const collector = new Collector(db);
    const noteId = await db.notes.add(TEST_NOTE);

    const lastSyncedTime = Date.now();

    await delay(1000);

    await db.notes.add({ id: noteId, pinned: true });

    const items = [];
    for await (const item of collector.collect(100, lastSyncedTime, false)) {
      items.push(item);
    }

    expect(items).toHaveLength(1);
    expect(items[0].items[0].id).toBe(noteId);
  }));

test("note edited before last synced time should not get included in collector", () =>
  databaseTest().then(async (db) => {
    await loginFakeUser(db);
    const collector = new Collector(db);
    const noteId = await db.notes.add(TEST_NOTE);

    await db.notes.add({ id: noteId, pinned: true });

    await delay(500);

    const lastSyncedTime = Date.now();

    const items = [];
    for await (const item of collector.collect(100, lastSyncedTime, false)) {
      items.push(item);
    }

    expect(items).toHaveLength(0);
  }));

test("localOnly note should get included as a deleted item in collector", () =>
  databaseTest().then(async (db) => {
    await loginFakeUser(db);
    const collector = new Collector(db);
    await db.notes.add({ ...TEST_NOTE, localOnly: true });

    const items = [];
    for await (const item of collector.collect(100, 0, false)) {
      items.push(item);
    }

    expect(items).toHaveLength(2);

    expect(items[0].items[0].length).toBe(104);
    expect(items[1].items[0].length).toBe(104);
    expect(items[0].type).toBe("content");
    expect(items[1].type).toBe("note");
  }));
