import DB from "../../api";
import StorageInterface from "../../__mocks__/storage.mock";
import { getLastWeekTimestamp } from "../../utils/date";

const TEST_NOTEBOOK = {
  title: "Test Notebook",
  description: "Test Description",
  topics: ["hello", "hello", "    "],
};

const TEST_NOTEBOOK2 = {
  title: "Test Notebook 2",
  description: "Test Description 2",
  topics: ["Home2"],
};

function databaseTest() {
  let db = new DB(StorageInterface);
  return db.init().then(() => db);
}

const notebookTest = (notebook = TEST_NOTEBOOK) =>
  databaseTest().then(async (db) => {
    let id = await db.notebooks.add(notebook);
    return { db, id };
  });

var TEST_NOTE = {
  content: {
    delta: {
      ops: [
        { insert: "Hello\n" },
        { insert: "This is colorful", attributes: { color: "#f00" } },
      ],
    },
    text: "I am a text",
  },
};

const LONG_TEXT =
  "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";

const noteTest = (note = TEST_NOTE) =>
  databaseTest().then(async (db) => {
    let id = await db.notes.add(note);
    return { db, id };
  });

const groupedTest = (type, special = false) =>
  noteTest().then(async ({ db }) => {
    await db.notes.add({ ...TEST_NOTE, title: "HELLO WHAT!" });
    await db.notes.add({
      ...TEST_NOTE,
      title: "Some title",
      dateCreated: getLastWeekTimestamp() - 604800000,
    });
    await db.notes.add({
      ...TEST_NOTE,
      title: "Some title and title title",
      dateCreated: getLastWeekTimestamp() - 604800000 * 2,
    });
    let grouped = db.notes.group(type, special);
    if (special) {
      expect(grouped.items.length).toBeGreaterThan(0);
      expect(grouped.groups.length).toBeGreaterThan(0);
      expect(grouped.groupCounts.length).toBeGreaterThan(0);
      // check order
      expect(grouped.groups[0].title).toBe("Pinned");
      return;
    }
    expect(grouped.length).toBeGreaterThan(0);
    expect(grouped[0].data.length).toBeGreaterThan(0);
    expect(grouped[0].title.length).toBeGreaterThan(0);
  });

export {
  databaseTest,
  notebookTest,
  noteTest,
  groupedTest,
  StorageInterface,
  TEST_NOTEBOOK,
  TEST_NOTEBOOK2,
  TEST_NOTE,
  LONG_TEXT,
};
