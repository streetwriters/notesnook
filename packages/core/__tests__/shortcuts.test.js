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

import { databaseTest, notebookTest } from "./utils";
import { test, expect } from "vitest";

test("create a shortcut of an invalid item should throw", () =>
  databaseTest().then(async (db) => {
    await expect(() =>
      db.shortcuts.add({ itemType: "HELLO!" })
    ).rejects.toThrow(/cannot create a shortcut/i);
  }));

test("create a shortcut of notebook", () =>
  notebookTest().then(async ({ db, id }) => {
    await db.shortcuts.add({ itemType: "notebook", itemId: id });
    expect(await db.shortcuts.exists(id)).toBe(true);
    expect(await db.shortcuts.all.has(id)).toBe(true);
  }));

test("create a duplicate shortcut of notebook", () =>
  notebookTest().then(async ({ db, id }) => {
    await db.shortcuts.add({ itemType: "notebook", itemId: id });
    await db.shortcuts.add({ itemType: "notebook", itemId: id });

    expect(await db.shortcuts.all.count()).toBe(1);
    expect(await db.shortcuts.all.has(id)).toBe(true);
  }));

test("pin a tag", () =>
  databaseTest().then(async (db) => {
    const tagId = await db.tags.add({ title: "HELLO!" });
    await db.shortcuts.add({ itemType: "tag", itemId: tagId });

    expect(await db.shortcuts.all.count()).toBe(1);
    expect(await db.shortcuts.all.has(tagId)).toBe(true);
  }));

test("remove shortcut", () =>
  databaseTest().then(async (db) => {
    const tagId = await db.tags.add({ title: "HELLO!" });
    const shortcutId = await db.shortcuts.add({
      itemType: "tag",
      itemId: tagId
    });

    expect(await db.shortcuts.all.count()).toBe(1);

    await db.shortcuts.remove(shortcutId);
    expect(await db.shortcuts.all.count()).toBe(0);
  }));
