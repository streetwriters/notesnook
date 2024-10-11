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

import { databaseTest, noteTest, TEST_NOTE } from "./utils/index.js";
import { test, expect } from "vitest";

function tag(title: string) {
  return { title };
}

function color(title: string) {
  return { title, colorCode: "#ffff22" };
}

for (const type of ["tag", "color"] as const) {
  const collection = type === "color" ? "colors" : "tags";
  const item = type === "color" ? color : tag;

  test(`${type} a note`, () =>
    noteTest().then(async ({ db, id }) => {
      const tagId = await db[collection].add(item("hello"));
      await db.relations.add({ id: tagId, type }, { id, type: "note" });

      expect((await db[collection][type](tagId)).title).toBe("hello");
      expect(await db.relations.from({ id: tagId, type }, "note").count()).toBe(
        1
      );
    }));

  test(`${type} 2 notes`, () =>
    noteTest().then(async ({ db, id }) => {
      const id2 = await db.notes.add(TEST_NOTE);
      if (!id2) throw new Error("Failed to create note.");

      const tagId = await db[collection].add(item("hello"));
      await db.relations.add({ id: tagId, type }, { id, type: "note" });
      await db.relations.add({ id: tagId, type }, { id: id2, type: "note" });

      expect((await db[collection][type](tagId)).title).toBe("hello");
      expect(await db.relations.from({ id: tagId, type }, "note").count()).toBe(
        2
      );
    }));

  test(`rename a ${type}`, () =>
    databaseTest().then(async (db) => {
      const tagId = await db[collection].add(item("hello"));
      await db[collection].add({ id: tagId, title: `hello (new)` });
      expect((await db[collection][type](tagId)).title).toBe("hello (new)");
    }));

  test(`remove a ${type}`, () =>
    noteTest().then(async ({ db, id }) => {
      const tagId = await db[collection].add(item("hello"));
      await db.relations.add({ id: tagId, type }, { id, type: "note" });
      await db[collection].remove(tagId);

      expect(await db[collection].collection.count()).toBe(0);
      expect(await db.relations.from({ id: tagId, type }, "note").count()).toBe(
        0
      );
    }));

  test(`invalid characters from ${type} title are removed`, () =>
    databaseTest().then(async (db) => {
      const tagId = await db[collection].add(
        item("    \n\n\n\t\t\thello          l\n\n\n\t\t       ")
      );
      expect((await db[collection][type](tagId)).title).toBe(
        "hello          l"
      );
    }));

  test(`remove a note from ${type}`, () =>
    noteTest().then(async ({ db, id }) => {
      const tagId = await db[collection].add(item("hello"));
      await db.relations.add({ id: tagId, type }, { id, type: "note" });

      await db.relations.unlink({ id: tagId, type }, { id, type: "note" });
      expect(await db.relations.from({ id: tagId, type }, "note").count()).toBe(
        0
      );
    }));
}
