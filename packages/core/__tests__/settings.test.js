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

import { databaseTest } from "./utils/index.ts";
import { test, expect } from "vitest";

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

test("save trash cleanup interval", () =>
  databaseTest().then(async (db) => {
    const interval = 7;
    await db.settings.setTrashCleanupInterval(interval);
    expect(db.settings.getTrashCleanupInterval()).toBe(interval);
  }));

test("get notebook group options", () =>
  databaseTest().then(async (db) => {
    const notebookId = "test-notebook-id";
    const groupOptions = {
      groupBy: "year",
      sortBy: "title",
      sortDirection: "asc"
    };
    await db.settings.setNotebookGroupOptions(notebookId, groupOptions);
    expect(db.settings.getNotebookGroupOptions(notebookId)).toMatchObject(
      groupOptions
    );
  }));

test("get notebook group options fallback to notes options", () =>
  databaseTest().then(async (db) => {
    const notebookId = "non-existent-notebook-id";
    const defaultNotesOptions = db.settings.getGroupOptions("notes");
    const result = db.settings.getNotebookGroupOptions(notebookId);
    expect(result).toMatchObject(defaultNotesOptions);
  }));

test("get tag group options", () =>
  databaseTest().then(async (db) => {
    const tagId = "test-tag-id";
    const groupOptions = {
      groupBy: "year",
      sortBy: "title",
      sortDirection: "asc"
    };
    await db.settings.setTagGroupOptions(tagId, groupOptions);
    expect(db.settings.getTagGroupOptions(tagId)).toMatchObject(groupOptions);
  }));

test("get tag group options fallback to notes options", () =>
  databaseTest().then(async (db) => {
    const tagId = "non-existent-tag-id";
    const defaultTagsOptions = db.settings.getGroupOptions("notes");
    const result = db.settings.getTagGroupOptions(tagId);
    expect(result).toMatchObject(defaultTagsOptions);
  }));
