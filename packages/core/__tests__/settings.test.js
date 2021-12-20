import { databaseTest } from "./utils";

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
        [tag.id]: "hello232",
      },
    });
    expect(db.tags.tag(tag.id).alias).toBe("hello232");
  }));
