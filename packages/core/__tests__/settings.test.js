import { databaseTest } from "./utils";

test("settings' dateEdited should not update on init", () =>
  databaseTest().then(async (db) => {
    const beforeDateEdited = db.settings._settings.dateEdited;
    await db.settings.init();
    const afterDateEdited = db.settings._settings.dateEdited;
    expect(beforeDateEdited).toBe(afterDateEdited);
  }));

test("settings' dateEdited should update after merge conflict resolve", () =>
  databaseTest().then(async (db) => {
    await db.storage.write("lastSynced", 0);
    const beforeDateEdited = (db.settings._settings.dateEdited = 1);
    await db.settings.merge({ pins: [], groupOptions: {}, aliases: {} });
    const afterDateEdited = db.settings._settings.dateEdited;
    expect(afterDateEdited).toBeGreaterThan(beforeDateEdited);
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
