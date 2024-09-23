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

import { databaseTest, notebookTest } from "./utils/index.ts";
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
    expect(db.shortcuts.exists(id)).toBe(true);
    expect(db.shortcuts.all.find((s) => s.id === id)).toBeDefined();
  }));

test("create a duplicate shortcut of notebook", () =>
  notebookTest().then(async ({ db, id }) => {
    await db.shortcuts.add({ itemType: "notebook", itemId: id });
    await db.shortcuts.add({ itemType: "notebook", itemId: id });

    expect(db.shortcuts.all).toHaveLength(1);
    expect(db.shortcuts.all.find((s) => s.id === id)).toBeDefined();
  }));

test("pin a tag", () =>
  databaseTest().then(async (db) => {
    const tagId = await db.tags.add({ title: "HELLO!" });
    await db.shortcuts.add({ itemType: "tag", itemId: tagId });

    expect(db.shortcuts.all).toHaveLength(1);
    expect(db.shortcuts.all.find((s) => s.id === tagId)).toBeDefined();
  }));

test("remove shortcut", () =>
  databaseTest().then(async (db) => {
    const tagId = await db.tags.add({ title: "HELLO!" });
    const shortcutId = await db.shortcuts.add({
      itemType: "tag",
      itemId: tagId
    });

    expect(db.shortcuts.all).toHaveLength(1);

    await db.shortcuts.remove(shortcutId);
    expect(db.shortcuts.all).toHaveLength(0);
  }));
