import StorageInterface from "../__mocks__/storage.mock";
import Storage from "../database/storage";

const storage = new Storage(StorageInterface);
test("add a value", async () => {
  await storage.write("hello", "world");
  let value = await storage.read("hello");
  expect(value).toBe("world");
});

test("remove", async () => {
  await storage.remove("hello");
  let value = await storage.read("hello");
  expect(value).toBeUndefined();
});

test("clear", async () => {
  await storage.write("hello", "world");
  storage.clear();
  let value = await storage.read("hello");
  expect(value).toBeUndefined();
});
