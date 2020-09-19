import DB from "../api";
import Constants from "../utils/constants";
import StorageInterface from "../__mocks__/storage.mock";

test("db.host should change HOST", () => {
  const db = new DB(StorageInterface);
  db.host("hello world");
  expect(Constants.HOST).toBe("hello world");
});
