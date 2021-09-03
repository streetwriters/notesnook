import { noteTest, TEST_NOTE, StorageInterface } from "./utils";

beforeEach(async () => {
  StorageInterface.clear();
});

function checkColorValue(note, value) {
  expect(note.data.color).toBe(value);
}

function checkTagValue(note, value) {
  expect(note.data.tags[0]).toBe(value);
}

describe.each([
  ["tag", "untag", "tagged", "hello"],
  ["color", "uncolor", "colored", "red"],
])("%s", (action, unaction, filter, value) => {
  let check = action === "tag" ? checkTagValue : checkColorValue;
  let collection = action === "tag" ? "tags" : "colors";
  // let key = action === "tag" ? "tags" : "color";

  test(`${action} a note`, () =>
    noteTest().then(async ({ db, id }) => {
      let note = db.notes.note(id);
      await note[action](value);
      note = db.notes.note(id);
      check(note, value);
      expect(db[collection].all[0].title).toBe(value);
      expect(db[collection].all[0].noteIds.length).toBe(1);
    }));

  test(`${action} 2 notes`, () =>
    noteTest().then(async ({ db, id }) => {
      const id2 = await db.notes.add(TEST_NOTE);
      let note = db.notes.note(id);
      await note[action](value);
      note = db.notes.note(id2);
      await note[action](value);
      expect(db[collection].all[0].title).toBe(value);
      expect(db[collection].all[0].noteIds.length).toBe(2);
    }));

  test(`${unaction} from note`, () =>
    noteTest().then(async ({ db, id }) => {
      let note = db.notes.note(id);
      await note[action](value);
      note = db.notes.note(id);
      check(note, value);
      await note[unaction](value);
      note = db.notes.note(id);
      check(note, undefined);
      expect(db[collection].all.length).toBe(0);
    }));

  test(`get ${collection}`, () =>
    noteTest().then(async ({ db, id }) => {
      let note = db.notes.note(id);
      await note[action](value);
      expect(db[collection].all.length).toBeGreaterThan(0);
    }));

  test(`get notes in ${action}`, () =>
    noteTest().then(async ({ db, id }) => {
      let note = db.notes.note(id);
      await note[action](value);
      const tag = db[collection].all.find((v) => v.title === value);
      const filteredNotes = db.notes[filter](tag.id);
      check(db.notes.note(filteredNotes[0]), value);
    }));

  test(`rename a ${action}`, () =>
    noteTest().then(async ({ db, id }) => {
      let note = db.notes.note(id);
      await note[action](value);
      let tag = db[collection].tag(value);
      await db[collection].rename(tag.id, value + "-new");
      tag = db[collection].tag(tag.id);
      expect(db[collection].alias(tag.id)).toBe(value + "-new");
    }));

  test(`remove a ${action}`, () =>
    noteTest().then(async ({ db, id }) => {
      let note = db.notes.note(id);
      await note[action](value);

      let tag = db[collection].tag(value);
      await db[collection].remove(tag.id);
      expect(db[collection].tag(value)).toBeUndefined();
    }));
});
