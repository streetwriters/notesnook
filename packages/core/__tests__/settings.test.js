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

import { databaseTest, StorageInterface } from "./utils";

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
    await db.settings.merge({ groupOptions: {}, aliases: {} });
    const afterDateModified = db.settings._settings.dateModified;
    expect(afterDateModified).toBeGreaterThan(beforeDateModified);
  }));

test("tag alias should update if aliases in settings update", () =>
  databaseTest().then(async (db) => {
    const tag = await db.tags.add("hello");
    await db.settings.merge({
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
