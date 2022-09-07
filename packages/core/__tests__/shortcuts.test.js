/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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

import { databaseTest, notebookTest, StorageInterface } from "./utils";

beforeEach(() => {
  StorageInterface.clear();
});

test("create a shortcut of an invalid item should throw", () =>
  databaseTest().then(async (db) => {
    await expect(() =>
      db.shorcuts.add({ item: { type: "HELLO!" } })
    ).rejects.toThrow(/cannot create a shortcut/i);
  }));

test("create a shortcut of notebook", () =>
  notebookTest().then(async ({ db, id }) => {
    await db.shorcuts.add({ item: { type: "notebook", id } });
    expect(db.shorcuts.exists(id)).toBe(true);
    expect(db.shorcuts.all[0].item.id).toBe(id);
  }));

test("create a duplicate shortcut of notebook", () =>
  notebookTest().then(async ({ db, id }) => {
    await db.shorcuts.add({ item: { type: "notebook", id } });
    await db.shorcuts.add({ item: { type: "notebook", id } });

    expect(db.shorcuts.all).toHaveLength(1);
    expect(db.shorcuts.all[0].item.id).toBe(id);
  }));

test("create shortcut of a topic", () =>
  notebookTest().then(async ({ db, id }) => {
    const notebook = db.notebooks.notebook(id)._notebook;
    const topic = notebook.topics[0];
    await db.shorcuts.add({
      item: { type: "topic", id: topic.id, notebookId: id }
    });

    expect(db.shorcuts.all).toHaveLength(1);
    expect(db.shorcuts.all[0].item.id).toBe(topic.id);
  }));

test("pin a tag", () =>
  databaseTest().then(async (db) => {
    const tag = await db.tags.add("HELLO!");
    await db.shorcuts.add({ item: { type: "tag", id: tag.id } });

    expect(db.shorcuts.all).toHaveLength(1);
    expect(db.shorcuts.all[0].item.id).toBe(tag.id);
  }));

test("remove shortcut", () =>
  databaseTest().then(async (db) => {
    const tag = await db.tags.add("HELLO!");
    const shortcutId = await db.shorcuts.add({
      item: { type: "tag", id: tag.id }
    });

    expect(db.shorcuts.all).toHaveLength(1);

    await db.shorcuts.remove(shortcutId);
    expect(db.shorcuts.all).toHaveLength(0);
  }));
