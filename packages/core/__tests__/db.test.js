import DB from "../api";
import Constants from "../utils/constants";
import StorageInterface from "../__mocks__/storage.mock";

test("db.host should change HOST", () => {
  const db = new DB(StorageInterface);
  db.host({ API_HOST: "hello world" });
  expect(Constants.API_HOST).toBe("hello world");
});
