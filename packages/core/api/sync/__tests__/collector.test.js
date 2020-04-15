import StorageInterface from "../../../__mocks__/storage.mock";
import Collector from "../collector";
import { enableFetchMocks, disableFetchMocks } from "jest-fetch-mock";
import {
  noteTest,
  TEST_NOTE,
  TEST_NOTEBOOK,
  databaseTest,
} from "../../../__tests__/utils";
import { login } from "./utils";

function getMainCollectionParams(name, testItem) {
  return [
    name,
    (db, collection) => db[collection].add(testItem),
    (db, collection) =>
      db[collection].add({
        ...testItem,
        id: Math.random().toString(),
        remote: true,
        dateEdited: 1,
      }),
  ];
}

function getTagsCollectionParams(name, testItem) {
  return [
    name,
    (db, collection) => db[collection].add(testItem + Math.random(), 2),
    (db, collection) =>
      db[collection]._collection.addItem({
        title: testItem + MAX_ITEMS + 1,
        noteIds: [2],
        deletedIds: [],
        id: Math.random().toString(),
        remote: true,
        dateEdited: 1,
      }),
  ];
}

const MAX_ITEMS = 5;

const tests = [
  getMainCollectionParams("notes", TEST_NOTE),
  getMainCollectionParams("notebooks", TEST_NOTEBOOK),
  getTagsCollectionParams("tags", "someTag"),
  getTagsCollectionParams("colors", "red"),
  getMainCollectionParams("trash", {
    id: 2141,
    type: "note",
    title: "someTitle",
  }),
  getMainCollectionParams("delta", { ops: [{ insert: "true" }] }),
  getMainCollectionParams("text", "true"),
];

describe.each(tests)("%s preparation", (collection, add, addExtra) => {
  beforeAll(() => {
    enableFetchMocks();
  });

  beforeEach(() => {
    fetch.resetMocks();
    StorageInterface.clear();
  });

  test(`prepare ${collection} when user has never synced before`, () => {
    return databaseTest().then(async (db) => {
      await login(db);
      await Promise.all(
        Array(MAX_ITEMS)
          .fill(0)
          .map(() => add(db, collection))
      );
      const collector = new Collector(db);
      const data = await collector.collect(0);
      expect(data[collection].length).toBe(MAX_ITEMS);
      expect(
        data[collection].every((item) => !!item.iv && !!item.cipher)
      ).toBeTruthy();
    });
  });

  test(`prepare ${collection} when user has synced before`, () => {
    return databaseTest().then(async (db) => {
      await login(db);
      await Promise.all(
        Array(MAX_ITEMS)
          .fill(0)
          .map(() => add(db, collection))
      );
      await addExtra(db, collection);
      const collector = new Collector(db);
      const data = await collector.collect(10);
      expect(data[collection].length).toBe(MAX_ITEMS);
      expect(
        data[collection].every((item) => !!item.iv && !!item.cipher)
      ).toBeTruthy();
    });
  });
});
