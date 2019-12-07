import StorageInterface from "../../notes-web/src/interfaces/storage";
import Storage from "../helpers/storage";
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
  await storage.clear();
  let value = await storage.read("hello");
  expect(value).toBeUndefined();
});
