import { notebookTest, StorageInterface } from "./utils";

beforeEach(() => StorageInterface.clear());

test("get empty topic", () =>
  notebookTest().then(({ db, id }) => {
    let topic = db.notebooks.notebook(id).topics.topic("General");
    expect(topic.all.length).toBe(0);
  }));

test("getting invalid topic should throw", () =>
  notebookTest().then(({ db, id }) => {
    expect(() => db.notebooks.topics(id).get("invalid")).toThrow();
  }));

test("add topic to notebook", () =>
  notebookTest().then(async ({ db, id }) => {
    let topics = db.notebooks.notebook(id).topics;
    await topics.add("Home");
    expect(topics.all.length).toBeGreaterThan(1);
    expect(topics.all.findIndex(v => v.title === "Home")).toBeGreaterThan(-1);
  }));

test("duplicate topic to notebook should not be added", () =>
  notebookTest().then(async ({ db, id }) => {
    let topics = db.notebooks.notebook(id).topics;
    await topics.add("Home");
    let len = topics.all.length;
    await topics.add("Home");
    expect(topics.all.length).toBe(len);
  }));

test("get topic", () =>
  notebookTest().then(async ({ db, id }) => {
    let topics = db.notebooks.notebook(id).topics;
    let topic = await topics.add("Home");
    let noteId = await db.notes.add({ content: { text: "Hello", delta: [] } });
    await topic.add(noteId);
    expect(topic.all[0].content.text).toBe("Hello");
  }));

test("delete a topic", () =>
  notebookTest().then(async ({ db, id }) => {
    let topics = db.notebooks.notebook(id).topics;
    await topics.add("Home");
    await topics.delete("Home");
    expect(topics.all.findIndex(v => v.title === "Home")).toBe(-1);
  }));
