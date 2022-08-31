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

test("settings' dateModified should not update on init", () =>
  databaseTest().then(async (db) => {
    const beforeDateModified = db.settings._settings.dateModified;
    await db.settings.init();
    const afterDateModified = db.settings._settings.dateModified;
    expect(beforeDateModified).toBe(afterDateModified);
  }));

test("settings' dateModified should update after merge conflict resolve", () =>
  databaseTest().then(async (db) => {
    await db.storage.write("lastSynced", 0);
    const beforeDateModified = (db.settings._settings.dateModified = 1);
    await db.settings.merge({ pins: [], groupOptions: {}, aliases: {} });
    const afterDateModified = db.settings._settings.dateModified;
    expect(afterDateModified).toBeGreaterThan(beforeDateModified);
  }));

test("tag alias should update if aliases in settings update", () =>
  databaseTest().then(async (db) => {
    const tag = await db.tags.add("hello");
    await db.settings.merge({
      pins: [],
      groupOptions: {},
      aliases: {
        [tag.id]: "hello232"
      }
    });
    expect(db.tags.tag(tag.id).alias).toBe("hello232");
  }));

test("save group options", () =>
  databaseTest().then(async (db) => {
    const groupOptions = {
      groupBy: "abc",
      sortBy: "dateCreated",
      sortDirection: "asc"
    };
    await db.settings.setGroupOptions("home", groupOptions);
    expect(db.settings.getGroupOptions("home")).toMatchObject(groupOptions);
  }));

test("save toolbar config", () =>
  databaseTest().then(async (db) => {
    const toolbarConfig = {
      preset: "custom",
      config: ["bold", "italic"]
    };
    await db.settings.setToolbarConfig("mobile", toolbarConfig);
    expect(db.settings.getToolbarConfig("mobile")).toMatchObject(toolbarConfig);
  }));

test("pinning an invalid item should throw", () =>
  databaseTest().then(async (db) => {
    await expect(() => db.settings.pin("lolo", {})).rejects.toThrow(
      /item cannot be pinned/i
    );
  }));

test("pin a notebook", () =>
  notebookTest().then(async ({ db, id }) => {
    await db.settings.pin("notebook", { id });
    expect(db.settings.pins).toHaveLength(1);
    expect(db.settings.pins[0].id).toBe(id);
  }));

test("pin an already pinned notebook", () =>
  notebookTest().then(async ({ db, id }) => {
    await db.settings.pin("notebook", { id });
    await db.settings.pin("notebook", { id });

    expect(db.settings.pins).toHaveLength(1);
    expect(db.settings.pins[0].id).toBe(id);
  }));

test("pin a topic", () =>
  notebookTest().then(async ({ db, id }) => {
    const notebook = db.notebooks.notebook(id)._notebook;
    const topic = notebook.topics[0];
    await db.settings.pin("topic", { id: topic.id, notebookId: id });
    expect(db.settings.pins).toHaveLength(1);
    expect(db.settings.pins[0].id).toBe(topic.id);
  }));

test("pin a tag", () =>
  databaseTest().then(async (db) => {
    const tag = await db.tags.add("HELLO!");
    await db.settings.pin("tag", { id: tag.id });
    expect(db.settings.pins).toHaveLength(1);
    expect(db.settings.pins[0].id).toBe(tag.id);
  }));

test("unpin a pinned item", () =>
  databaseTest().then(async (db) => {
    const tag = await db.tags.add("HELLO!");
    await db.settings.pin("tag", { id: tag.id });
    expect(db.settings.pins).toHaveLength(1);
    expect(db.settings.pins[0].id).toBe(tag.id);

    await db.settings.unpin(tag.id);
    expect(db.settings.pins).toHaveLength(0);
  }));
