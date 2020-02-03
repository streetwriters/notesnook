import DB from "../api";
import StorageInterface from "../__mocks__/storage.mock";
import { getLastWeekTimestamp } from "../utils/date";

var TEST_NOTE = {
  content: { delta: "I am a delta", text: "I am a text" }
};

const LONG_TEXT =
  "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";

function databaseTest() {
  let db = new DB(StorageInterface);
  return db.init().then(() => db);
}

const noteTest = (note = TEST_NOTE) =>
  databaseTest().then(async db => {
    let id = await db.notes.add(note);
    return { db, id };
  });

const groupedTest = (type, special = false) =>
  noteTest().then(async ({ db }) => {
    await db.notes.add({ ...TEST_NOTE, title: "HELLO WHAT!" });
    await db.notes.add({
      ...TEST_NOTE,
      title: "Some title",
      dateCreated: getLastWeekTimestamp() - 604800000
    });
    await db.notes.add({
      ...TEST_NOTE,
      title: "Some title and title title",
      dateCreated: getLastWeekTimestamp() - 604800000 * 2
    });
    let grouped = db.notes.group(type, special);
    if (special) {
      expect(grouped.items.length).toBeGreaterThan(0);
      expect(grouped.groups.length).toBeGreaterThan(0);
      expect(grouped.groupCounts.length).toBeGreaterThan(0);
      return;
    }
    expect(grouped.length).toBeGreaterThan(0);
    expect(grouped[0].data.length).toBeGreaterThan(0);
    expect(grouped[0].title.length).toBeGreaterThan(0);
  });

beforeEach(async () => {
  StorageInterface.clear();
});

test("add invalid note", () =>
  databaseTest().then(async db => {
    let id = await db.notes.add();
    expect(id).toBeUndefined();
    id = await db.notes.add({});
    expect(id).toBeUndefined();
    id = await db.notes.add({ hello: "world" });
    expect(id).toBeUndefined();
  }));

test("add note", () =>
  noteTest().then(async ({ db, id }) => {
    expect(id).toBeDefined();
    let note = db.notes.get(id);
    expect(note).toBeDefined();
    expect(note.content).toStrictEqual(TEST_NOTE.content);
  }));

test("get all notes", () =>
  noteTest().then(async ({ db }) => {
    expect(db.notes.all.length).toBeGreaterThan(0);
  }));

test("search all notes", () =>
  noteTest({
    content: { delta: "5", text: "5" }
  }).then(async ({ db }) => {
    let filtered = db.notes.filter("5");
    expect(filtered.length).toBeGreaterThan(0);
  }));

test("note without a title should get title from content", () =>
  noteTest().then(async ({ db, id }) => {
    let note = db.notes.get(id);
    expect(note.title).toBe("I am a");
  }));

test("update note", () =>
  noteTest().then(async ({ db, id }) => {
    let noteData = {
      id,
      title: "I am a new title",
      content: {
        text: LONG_TEXT,
        delta: []
      },
      pinned: true,
      favorite: true
      // colors: ["red", "blue"]
    };
    id = await db.notes.add(noteData);
    let note = db.notes.get(id);
    expect(note.title).toBe(noteData.title);
    expect(note.content).toStrictEqual(noteData.content);
    expect(note.pinned).toBe(true);
    expect(note.favorite).toBe(true);
  }));

test("updating empty note should delete it", () =>
  noteTest().then(async ({ db, id }) => {
    id = await db.notes.add({
      id,
      title: "\n\n",
      content: {
        text: "",
        delta: []
      }
    });
    expect(id).toBeUndefined();
    let note = db.notes.get(id);
    expect(note).toBeUndefined();
  }));

test("add tag to note", () =>
  noteTest().then(async ({ db, id }) => {
    await db.notes.tag(id, "hello");
    expect(db.notes.get(id).tags[0]).toBe("hello");
    expect(db.notes.tags[0].title).toBe("hello");
  }));

test("remove tag from note", () =>
  noteTest().then(async ({ db, id }) => {
    await db.notes.tag(id, "hello");
    expect(db.notes.get(id).tags[0]).toBe("hello");
    expect(db.notes.tags[0].title).toBe("hello");
    await db.notes.untag(id, "hello");
    expect(db.notes.get(id).tags.length).toBe(0);
    expect(db.notes.tags.length).toBe(0);
  }));

test("note with text longer than 150 characters should have ... in the headline", () =>
  noteTest({
    content: {
      text: LONG_TEXT,
      delta: []
    }
  }).then(({ db, id }) => {
    let note = db.notes.get(id);
    expect(note.headline.includes("...")).toBe(true);
  }));

test("get tags", () =>
  noteTest({
    ...TEST_NOTE,
    tags: ["new", "tag", "goes", "here"]
  }).then(async ({ db }) => {
    expect(db.notes.tags.length).toBeGreaterThan(0);
  }));

test("get notes in tag", () =>
  noteTest({
    ...TEST_NOTE,
    tags: ["new", "tag", "goes", "here"]
  }).then(async ({ db }) => {
    expect(db.notes.tagged("tag")[0].tags).toStrictEqual([
      "new",
      "tag",
      "goes",
      "here"
    ]);
  }));

test("get favorite notes", () =>
  noteTest({
    favorite: true,
    content: { delta: "Hello", text: "Hello" }
  }).then(({ db }) => {
    expect(db.notes.favorites.length).toBeGreaterThan(0);
  }));

test("get pinned notes", () =>
  noteTest({
    pinned: true,
    content: { delta: "Hello", text: "Hello" }
  }).then(({ db }) => {
    expect(db.notes.pinned.length).toBeGreaterThan(0);
  }));

test("get grouped notes by abc", () => groupedTest("abc"));

test("get grouped notes by abc (special)", () => groupedTest("abc", true));

test("get grouped notes by month", () => groupedTest("month"));

test("get grouped notes by month (special)", () => groupedTest("month", true));

test("get grouped notes by year", () => groupedTest("year"));

test("get grouped notes by year (special)", () => groupedTest("year", true));

test("get grouped notes by weak", () => groupedTest("week"));

test("get grouped notes by weak (special)", () => groupedTest("week", true));

test("get grouped notes default", () => groupedTest());

test("get grouped notes default (special)", () => groupedTest("", true));

test("pin note", () =>
  noteTest().then(async ({ db, id }) => {
    await db.notes.pin(id);
    expect(db.notes.get(id).pinned).toBe(true);
  }));

test("favorite note", () =>
  noteTest().then(async ({ db, id }) => {
    await db.notes.favorite(id);
    expect(db.notes.get(id).favorite).toBe(true);
  }));

test("lock and unlock note", () =>
  noteTest().then(async ({ db, id }) => {
    expect(await db.notes.lock(id, "password123")).toBe(true);
    let note = db.notes.get(id);
    expect(note.locked).toBe(true);
    expect(note.content.iv).toBeDefined();
    note = await db.notes.unlock(id, "password123");
    expect(note.dateCreated).toBe(id);
    expect(note.content.text).toBe(TEST_NOTE.content.text);
    await db.notes.unlock(id, "password123", true);
    note = db.notes.get(id);
    expect(note.locked).toBe(false);
  }));
