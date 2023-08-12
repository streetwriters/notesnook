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
  StorageInterface,
  databaseTest,
  noteTest,
  notebookTest
} from "./utils";
import v52Backup from "./__fixtures__/backup.v5.2.json";
import v52BackupCopy from "./__fixtures__/backup.v5.2.copy.json";
import v56BackupCopy from "./__fixtures__/backup.v5.6.json";
import qclone from "qclone";
import { beforeEach, test, expect, describe } from "vitest";

beforeEach(() => {
  StorageInterface.clear();
});

test("export backup", () =>
  noteTest().then(() =>
    notebookTest().then(async ({ db }) => {
      const exp = await db.backup.export("node");
      let backup = JSON.parse(exp);
      expect(backup.type).toBe("node");
      expect(backup.date).toBeGreaterThan(0);
    })
  ));

test("export encrypted backup", () =>
  noteTest().then(() =>
    notebookTest().then(async ({ db }) => {
      const exp = await db.backup.export("node", true);
      let backup = JSON.parse(exp);
      expect(backup.type).toBe("node");
      expect(backup.date).toBeGreaterThan(0);
      expect(backup.data.iv).toBe("some iv");
    })
  ));

test("import backup", () =>
  noteTest().then(() =>
    notebookTest().then(async ({ db, id }) => {
      const exp = await db.backup.export("node");
      StorageInterface.clear();
      await db.backup.import(JSON.parse(exp));
      expect(db.notebooks.notebook(id).data.id).toBe(id);
    })
  ));

test("import encrypted backup", () =>
  noteTest().then(() =>
    notebookTest().then(async ({ db, id }) => {
      const exp = await db.backup.export("node", true);
      StorageInterface.clear();
      await db.backup.import(JSON.parse(exp), "password");
      expect(db.notebooks.notebook(id).data.id).toBe(id);
    })
  ));

test("import tempered backup", () =>
  noteTest().then(() =>
    notebookTest().then(async ({ db }) => {
      const exp = await db.backup.export("node");
      StorageInterface.clear();
      const backup = JSON.parse(exp);
      backup.data.hello = "world";
      await expect(db.backup.import(backup)).rejects.toThrow(/tempered/);
    })
  ));

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

      verifyIndex(data, db, "notes", "notes");
      verifyIndex(data, db, "notebooks", "notebooks");
      verifyIndex(data, db, "content", "content");
      verifyIndex(data, db, "attachments", "attachments");
      // verifyIndex(data, db, "trash", "trash");
    });
  });
});

function verifyIndex(backup, db, backupCollection, collection) {
  if (!backup.data[backupCollection]) return;

  expect(
    backup.data[backupCollection].every(
      (v) => db[collection]._collection.indexer.indices.indexOf(v) > -1
    )
  ).toBeTruthy();
}
