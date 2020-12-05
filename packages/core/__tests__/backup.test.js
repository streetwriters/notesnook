import {
  StorageInterface,
  databaseTest,
  noteTest,
  notebookTest,
} from "./utils";
import v0Backup from "./__fixtures__/backup.v0.json";
import v2Backup from "./__fixtures__/backup.v2.json";

beforeEach(async () => {
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
      await db.backup.import(exp);
      expect(db.notebooks.notebook(id).data.id).toBe(id);
    })
  ));

test("import encrypted backup", () =>
  noteTest().then(() =>
    notebookTest().then(async ({ db, id }) => {
      const exp = await db.backup.export("node", true);
      StorageInterface.clear();
      await db.backup.import(exp);
      expect(db.notebooks.notebook(id).data.id).toBe(id);
    })
  ));

test("import tempered backup", () =>
  noteTest().then(() =>
    notebookTest().then(async ({ db, id }) => {
      const exp = await db.backup.export("node");
      StorageInterface.clear();
      const backup = JSON.parse(exp);
      backup.data.hello = "world";
      await expect(
        db.backup.import(JSON.stringify(backup))
      ).rejects.toThrowError(/tempered/);
    })
  ));

test("import unversioned (v0) backup", () => {
  return databaseTest().then(async (db) => {
    await db.backup.import(JSON.stringify(v0Backup));

    expect(
      db.notes.all.every(
        (v) =>
          v.contentId &&
          !v.content &&
          !v.notebook &&
          (!v.notebooks || Array.isArray(v.notebooks))
      )
    ).toBeTruthy();

    expect(
      db.notebooks.all.every((v) => v.title != null && v.description != null)
    ).toBeTruthy();

    verifyIndex(v0Backup, db, "notes", "notes");
    verifyIndex(v0Backup, db, "notebooks", "notebooks");
    verifyIndex(v0Backup, db, "delta", "content");
    verifyIndex(v0Backup, db, "tags", "tags");
    verifyIndex(v0Backup, db, "colors", "colors");
    verifyIndex(v0Backup, db, "trash", "trash");
  });
});

test("import v2 backup", () => {
  return databaseTest().then(async (db) => {
    await db.backup.import(JSON.stringify(v2Backup));

    expect(db.settings.raw.id).toBeDefined();
    expect(db.settings.raw.pins.length).toBeGreaterThan(0);

    expect(
      db.notes.all.every(
        (v) => !v.notebook && (!v.notebooks || Array.isArray(v.notebooks))
      )
    ).toBeTruthy();

    verifyIndex(v2Backup, db, "notes", "notes");
    verifyIndex(v2Backup, db, "notebooks", "notebooks");
    verifyIndex(v2Backup, db, "content", "content");
    verifyIndex(v2Backup, db, "tags", "tags");
    verifyIndex(v2Backup, db, "colors", "colors");
    verifyIndex(v2Backup, db, "trash", "trash");
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
