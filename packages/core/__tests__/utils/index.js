import DB from "../../api";
import StorageInterface from "../../__mocks__/storage.mock";
import dayjs from "dayjs";
import { groupArray } from "../../utils/grouping";

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
    type: "tiny",
    data: `<p>Hello<br><span style="color:#f00">This is colorful</span></p>`,
  },
};

const LONG_TEXT =
  "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";

const noteTest = (note = TEST_NOTE) =>
  databaseTest().then(async (db) => {
    let id = await db.notes.add(note);
    return { db, id };
  });

const groupedTest = (type) =>
  noteTest().then(async ({ db }) => {
    await db.notes.add({ ...TEST_NOTE, title: "HELLO WHAT!" });
    await db.notes.add({
      ...TEST_NOTE,
      title: "Some title",
      dateCreated: dayjs().startOf("week").subtract(1, "day").unix(),
    });
    await db.notes.add({
      ...TEST_NOTE,
      title: "Some title and title title",
      dateCreated: dayjs().subtract(2, "weeks").unix(),
    });
    let grouped = groupArray(db.notes.all, {
      groupBy: type,
      sortDirection: "desc",
      sortBy: "dateCreated",
    });
    expect(grouped.length).toBeGreaterThan(1);
    expect(grouped.some((i) => i.type === "header")).toBe(true);
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
