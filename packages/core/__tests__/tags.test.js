import { noteTest, TEST_NOTE, StorageInterface } from "./utils";

beforeEach(async () => {
  StorageInterface.clear();
});

describe.each([
  ["tag", "untag", "tags", "tagged", ["hello", "tag"]],
  ["color", "uncolor", "colors", "colored", ["red", "blue"]],
])("%s", (action, unaction, collection, filter, values) => {
  test(`${action} a note`, () =>
    noteTest().then(async ({ db, id }) => {
      let note = db.notes.note(id);
      await note[action](values[0]);
      note = db.notes.note(id);
      expect(note[collection][0]).toBe(values[0]);
      expect(db[collection].all[0].title).toBe(values[0]);
      expect(db[collection].all[0].noteIds.length).toBe(1);
    }));

  test(`${action} 2 notes`, () =>
    noteTest().then(async ({ db, id }) => {
      const id2 = await db.notes.add(TEST_NOTE);
      let note = db.notes.note(id);
      await note[action](values[0]);
      note = db.notes.note(id2);
      await note[action](values[0]);
      expect(db[collection].all[0].title).toBe(values[0]);
      expect(db[collection].all[0].noteIds.length).toBe(2);
    }));

  test(`${unaction} from note`, () =>
    noteTest().then(async ({ db, id }) => {
      let note = db.notes.note(id);
      await note[action](values[0]);
      note = db.notes.note(id);
      expect(note[collection][0]).toBe(values[0]);
      expect(db[collection].all[0].title).toBe(values[0]);
      await note[unaction](values[0]);
      note = db.notes.note(id);
      expect(note[collection].length).toBe(0);
      expect(db[collection].all.length).toBe(0);
    }));

  test(`get ${collection}`, () =>
    noteTest({
      ...TEST_NOTE,
      [collection]: values,
    }).then(async ({ db }) => {
      expect(db[collection].all.length).toBeGreaterThan(0);
    }));

  test(`get notes in ${action}`, () =>
    noteTest({
      ...TEST_NOTE,
      [collection]: values,
    }).then(async ({ db }) => {
      const tag = db[collection].all.find((v) => v.title === values[0]);
      expect(db.notes[filter](tag.id)[0][collection]).toStrictEqual(values);
    }));
});
