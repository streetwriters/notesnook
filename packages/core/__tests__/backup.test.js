import {
  StorageInterface,
  databaseTest,
  noteTest,
  groupedTest,
  LONG_TEXT,
  TEST_NOTE,
  TEST_NOTEBOOK,
  notebookTest,
  TEST_NOTEBOOK2,
} from "./utils";

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
