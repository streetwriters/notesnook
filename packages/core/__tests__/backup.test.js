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
  TEST_NOTE,
  databaseTest,
  loginFakeUser,
  noteTest,
  notebookTest
} from "./utils";
import v52Backup from "./__fixtures__/backup.v5.2.json";
import v52BackupCopy from "./__fixtures__/backup.v5.2.copy.json";
import v56BackupCopy from "./__fixtures__/backup.v5.6.json";
import qclone from "qclone";
import { test, expect, describe } from "vitest";

test("export backup", () =>
  noteTest().then(() =>
    notebookTest().then(async ({ db }) => {
      const exp = [];
      for await (const file of db.backup.export("node", false)) {
        exp.push(file);
      }

      let backup = JSON.parse(exp[1].data);
      expect(exp.length).toBe(2);
      expect(exp[0].path).toBe(".nnbackup");
      expect(backup.type).toBe("node");
      expect(backup.date).toBeGreaterThan(0);
      expect(backup.data).toBeTypeOf("string");
      expect(backup.compressed).toBe(true);
      expect(backup.encrypted).toBe(false);
    })
  ));

test("export encrypted backup", () =>
  notebookTest().then(async ({ db }) => {
    await loginFakeUser(db);
    await db.notes.add(TEST_NOTE);

    const exp = [];
    for await (const file of db.backup.export("node", true)) {
      exp.push(file);
    }

    const backup = JSON.parse(exp[1].data);
    expect(exp.length).toBe(2);
    expect(exp[0].path).toBe(".nnbackup");
    expect(backup.type).toBe("node");
    expect(backup.date).toBeGreaterThan(0);
    expect(backup.data.iv).not.toBeUndefined();
    expect(backup.data).toBeTypeOf("object");
    expect(backup.compressed).toBe(true);
    expect(backup.encrypted).toBe(true);
  }));

test("import backup", () =>
  notebookTest().then(async ({ db, id }) => {
    await db.notes.add(TEST_NOTE);

    const exp = [];
    for await (const file of db.backup.export("node", false)) {
      exp.push(file);
    }

    await db.storage.clear();
    await db.backup.import(JSON.parse(exp[1].data));
    expect(db.notebooks.notebook(id).data.id).toBe(id);
  }));

test("import encrypted backup", () =>
  notebookTest().then(async ({ db, id }) => {
    await loginFakeUser(db);
    await db.notes.add(TEST_NOTE);

    const exp = [];
    for await (const file of db.backup.export("node", true)) {
      exp.push(file);
    }

    await db.storage.clear();
    await db.backup.import(JSON.parse(exp[1].data), "password");
    expect(db.notebooks.notebook(id).data.id).toBe(id);
  }));

test("import tempered backup", () =>
  notebookTest().then(async ({ db }) => {
    await db.notes.add(TEST_NOTE);

    const exp = [];
    for await (const file of db.backup.export("node", false)) {
      exp.push(file);
    }

    await db.storage.clear();
    const backup = JSON.parse(exp[1].data);
    backup.data += "hello";
    await expect(db.backup.import(backup)).rejects.toThrow(/tempered/);
  }));

describe.each([
  ["v5.2", v52Backup],
  ["v5.2 copy", v52BackupCopy],
  ["v5.6", v56BackupCopy]
])("testing backup version: %s", (version, data) => {
  test(`import ${version} backup`, () => {
    return databaseTest().then(async (db) => {
      await db.backup.import(qclone(data));

      expect(db.settings.raw.id).toBeDefined();
      expect(db.settings.raw.dateModified).toBeDefined();
      expect(db.settings.raw.dateEdited).toBeUndefined();
      expect(db.settings.raw.pins).toBeUndefined();

      expect(
        db.notes.all.every((v) => {
          const doesNotHaveContent = !v.content;
          const doesNotHaveColors = !v.colors && (!v.color || v.color.length);
          const hasTopicsInAllNotebooks =
            !v.notebooks ||
            v.notebooks.every((nb) => !!nb.id && !!nb.topics && !nb.topic);
          const hasDateModified = v.dateModified > 0;
          return (
            doesNotHaveContent &&
            !v.notebook &&
            hasTopicsInAllNotebooks &&
            doesNotHaveColors &&
            hasDateModified
          );
        })
      ).toBeTruthy();

      expect(
        db.notebooks.all.every((v) => v.title != null && v.dateModified > 0)
      ).toBeTruthy();

      expect(
        db.notebooks.all.every((v) => v.topics.every((topic) => !topic.notes))
      ).toBeTruthy();

      expect(
        db.attachments.all.every((v) => v.dateModified > 0 && !v.dateEdited)
      ).toBeTruthy();

      expect(db.shortcuts.all).toHaveLength(data.data.settings.pins.length);

      const allContent = await db.content.all();
      expect(
        allContent.every((v) => v.type === "tiptap" || v.deleted)
      ).toBeTruthy();
      expect(allContent.every((v) => !v.persistDateEdited)).toBeTruthy();
      expect(allContent.every((v) => v.dateModified > 0)).toBeTruthy();

      expect(
        allContent.every(
          (v) =>
            !v.data.includes("tox-checklist") &&
            !v.data.includes("tox-checklist--checked")
        )
      ).toBeTruthy();
    });
  });

  test(`verify indices of ${version} backup`, () => {
    return databaseTest().then(async (db) => {
      await db.backup.import(qclone(data));

      const keys = await db.storage.getAllKeys();
      for (let key in data.data) {
        const item = data.data[key];
        if (item && !item.type && item.deleted) continue;
        if (
          key.startsWith("_uk_") ||
          key === "hasConflicts" ||
          key === "monographs" ||
          key === "token"
        )
          continue;

        expect(keys.some((k) => k.startsWith(key))).toBeTruthy();
      }
    });
  });
});
