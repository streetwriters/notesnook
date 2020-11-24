import {
  StorageInterface,
  databaseTest,
  noteTest,
  notebookTest,
} from "./utils";
import v0Backup from "./__fixtures__/backup.v0.json";

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

test.only("import unversioned (v0) backup", () => {
  return databaseTest().then(async (db) => {
    await db.backup.import(JSON.stringify(v0Backup));

    expect(
      db.notes.all.every(
        (v) => v.contentId && !v.content && (!v.notebook || !v.notebook.id)
      )
    ).toBeTruthy();

    expect(
      db.notebooks.all.every((v) => v.title != null && v.description != null)
    ).toBeTruthy();

    function verifyIndex(db, backupCollection, collection) {
      if (!v0Backup.data[backupCollection]) return;
      expect(
        v0Backup.data[backupCollection].every(
          (v) => db[collection]._collection.indexer.indices.indexOf(v) > -1
        )
      ).toBeTruthy();
    }

    verifyIndex(db, "notes", "notes");
    verifyIndex(db, "notebooks", "notebooks");
    verifyIndex(db, "delta", "content");
    verifyIndex(db, "tags", "tags");
    verifyIndex(db, "colors", "colors");
    verifyIndex(db, "trash", "trash");
  });
});
