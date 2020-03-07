import {
  StorageInterface,
  databaseTest,
  noteTest,
  groupedTest,
  LONG_TEXT,
  TEST_NOTE,
  TEST_NOTEBOOK
} from "./utils";

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
    let note = db.notes.note(id);
    expect(note.data).toBeDefined();
    expect(note.text).toStrictEqual(TEST_NOTE.content.text);
  }));

test("get delta of note", () =>
  noteTest().then(async ({ db, id }) => {
    let delta = await db.notes.note(id).delta();
    expect(delta).toStrictEqual(TEST_NOTE.content.delta);
  }));

test("delete note", () =>
  noteTest().then(async ({ db, id }) => {
    let { id: notebookId } = await db.notebooks.add(TEST_NOTEBOOK);
    let topics = db.notebooks.notebook(notebookId).topics;
    let topic = topics.topic("General");
    await topic.add(id);
    topic = topics.topic("General");
    expect(topic.all.findIndex(v => v.id === id)).toBeGreaterThan(-1);
    await db.notes.delete(id);
    expect(db.notes.note(id)).toBeUndefined();
    expect(topic.all.findIndex(v => v.id === id)).toBe(-1);
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
    let note = db.notes.note(id);
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
    let note = db.notes.note(id);
    expect(note.title).toBe(noteData.title);
    expect(note.text).toStrictEqual(noteData.content.text);
    expect(note.data.pinned).toBe(true);
    expect(note.data.favorite).toBe(true);
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
    let note = db.notes.note(id);
    expect(note).toBeUndefined();
  }));

test("add tag to note", () =>
  noteTest().then(async ({ db, id }) => {
    let note = db.notes.note(id);
    await note.tag("hello");
    note = db.notes.note(id);
    expect(note.tags[0]).toBe("hello");
    expect(db.tags.all[0].title).toBe("hello");
  }));

test("remove tag from note", () =>
  noteTest().then(async ({ db, id }) => {
    let note = db.notes.note(id);
    await note.tag("hello");
    note = db.notes.note(id);
    expect(note.tags[0]).toBe("hello");
    expect(db.tags.all[0].title).toBe("hello");
    await note.untag("hello");
    note = db.notes.note(id);
    expect(note.tags.length).toBe(0);
    expect(db.tags.all.length).toBe(0);
  }));

test("color a note", () =>
  noteTest().then(async ({ db, id }) => {
    let note = db.notes.note(id);
    await note.color("red");
    note = db.notes.note(id);
    expect(note.colors[0]).toBe("red");
    expect(db.colors.all[0].title).toBe("red");
  }));

test("uncolor a note", () =>
  noteTest().then(async ({ db, id }) => {
    let note = db.notes.note(id);
    await note.color("red");
    note = db.notes.note(id);
    expect(note.colors[0]).toBe("red");
    expect(db.colors.all[0].title).toBe("red");
    await note.uncolor("red");
    note = db.notes.note(id);
    expect(note.colors.length).toBe(0);
    expect(db.colors.all.length).toBe(0);
  }));

test("note with text longer than 150 characters should have ... in the headline", () =>
  noteTest({
    content: {
      text: LONG_TEXT,
      delta: []
    }
  }).then(({ db, id }) => {
    let note = db.notes.note(id);
    expect(note.headline.includes("...")).toBe(true);
  }));

test("get tags", () =>
  noteTest({
    ...TEST_NOTE,
    tags: ["new", "tag", "goes", "here"]
  }).then(async ({ db }) => {
    expect(db.tags.all.length).toBeGreaterThan(0);
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
    let note = db.notes.note(id);
    await note.pin();
    note = db.notes.note(id);
    expect(note.data.pinned).toBe(true);
  }));

test("favorite note", () =>
  noteTest().then(async ({ db, id }) => {
    let note = db.notes.note(id);
    await note.favorite();
    note = db.notes.note(id);
    expect(note.data.favorite).toBe(true);
  }));
/* 
test("lock a note", () =>
  noteTest().then(async ({ db, id }) => {
    let note = db.notes.note(id);
    await note.lock("password123");
    note = db.notes.note(id);
    expect(note.data.locked).toBe(true);
    expect(note.data.content.iv).toBeDefined();
    expect((await note.delta()).iv).toBeDefined();
  }));

test("unlock a locked note", () =>
  noteTest().then(async ({ db, id }) => {
    let note = db.notes.note(id);
    await note.lock("password123");
    note = db.notes.note(id);
    note = await note.unlock("password123");
    expect(note.id).toBe(id);
    expect(note.content.text).toBe(TEST_NOTE.content.text);
    expect(note.content.delta.ops).toBeDefined();
  }));

test("permanently unlock a locked note", () =>
  noteTest().then(async ({ db, id }) => {
    let note = db.notes.note(id);
    await note.lock("password123");
    note = db.notes.note(id);
    await note.unlock("password123", true);
    note = db.notes.note(id);
    expect((await note.delta()).ops).toBeDefined();
    expect(note.data.locked).toBe(false);
  })); */

test("add note to topic", () =>
  noteTest().then(async ({ db, id }) => {
    let { id: notebookId } = await db.notebooks.add({ title: "Hello" });
    let topics = db.notebooks.notebook(notebookId).topics;
    await topics.add("Home");
    let topic = topics.topic("Home");
    await topic.add(id);
    topic = topics.topic("Home");
    expect(topic.all.length).toBe(1);
    expect(topic.totalNotes).toBe(1);
    expect(db.notebooks.notebook(notebookId).data.totalNotes).toBe(1);
    let note = db.notes.note(id);
    expect(note.notebook.id).toBe(notebookId);
  }));

test("duplicate note to topic should not be added", () =>
  noteTest().then(async ({ db, id }) => {
    let { id: notebookId } = await db.notebooks.add({ title: "Hello" });
    let topics = db.notebooks.notebook(notebookId).topics;
    await topics.add("Home");
    let topic = topics.topic("Home");
    await topic.add(id);
    topic = topics.topic("Home");
    expect(topic.all.length).toBe(1);
  }));

test("move note", done =>
  noteTest().then(async ({ db, id }) => {
    let { id: notebookId } = await db.notebooks.add({ title: "Hello" });
    let topics = db.notebooks.notebook(notebookId).topics;
    await topics.add("Home");
    let topic = topics.topic("Home");
    await topic.add(id);
    setTimeout(async () => {
      try {
        let { id: notebookId2 } = await db.notebooks.add({ title: "Hello2" });
        await db.notebooks.notebook(notebookId2).topics.add("Home2");
        await db.notes.move({ id: notebookId2, topic: "Home2" }, id);
        let note = db.notes.note(id);
        expect(note.notebook.id).toBe(notebookId2);
        done();
      } catch (error) {
        done(error);
      }
    }, 1000);
  }));

test("moving note to same notebook and topic should do nothing", () =>
  noteTest().then(async ({ db, id }) => {
    const { id: notebookId } = await db.notebooks.add({ title: "Hello" });
    let topics = db.notebooks.notebook(notebookId).topics;
    await topics.add("Home");
    let topic = topics.topic("Home");
    await topic.add(id);
    await db.notes.move({ id: notebookId, topic: "Home" }, id);
    let note = db.notes.note(id);
    expect(note.notebook.id).toBe(notebookId);
  }));
