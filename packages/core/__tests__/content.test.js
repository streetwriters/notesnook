import { StorageInterface, databaseTest } from "./utils";

beforeEach(() => {
  StorageInterface.clear();
});

test("adding a deleted content should not throw", () =>
  databaseTest().then(async (db) => {
    await expect(
      db.content.add({
        remote: true,
        deleted: true,
        dateEdited: new Date(),
        id: "hello",
        data: "YOYO!"
      })
    ).resolves.toBeUndefined();
  }));
