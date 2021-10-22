const fetch = require("node-fetch");
window.fetch = fetch;
import UserManager from "../api/user-manager";
import DB from "../api";
import StorageInterface from "../__mocks__/storage.mock";

const user = {
  email: process.env.EMAIL,
  password: process.env.PASSWORD,
};

test.skip("signup user and check for token", async () => {
  const db = new DB(StorageInterface);
  const usermanager = new UserManager(db);

  await expect(
    usermanager.signup(user.email, user.password)
  ).resolves.not.toThrow();

  await expect(usermanager.tokenManager.getToken()).resolves.toBeDefined();
}, 30000);

test.skip("login user and check for token", async () => {
  const db = new DB(StorageInterface);
  const usermanager = new UserManager(db);

  await expect(
    usermanager.login(user.email, user.password)
  ).resolves.not.toThrow();

  await expect(usermanager.tokenManager.getToken()).resolves.toBeDefined();
}, 30000);

test.skip("login user and get user data", async () => {
  const db = new DB(StorageInterface);
  const usermanager = new UserManager(db);

  await usermanager.login(user.email, user.password);

  const userData = await usermanager.getUser();
  expect(userData.email).toBe(process.env.EMAIL);
}, 30000);

test.skip("login user and logout user", async () => {
  const db = new DB(StorageInterface);
  const usermanager = new UserManager(db);

  await usermanager.login(user.email, user.password);

  await expect(usermanager.logout()).resolves.not.toThrow();
}, 30000);

test.skip("login user and delete user", async () => {
  const db = new DB(StorageInterface);
  const usermanager = new UserManager(db);

  await usermanager.login(user.email, user.password);

  await expect(usermanager.deleteUser(user.password)).resolves.toBe(true);
}, 30000);

test("login user and get user sessions", async () => {
  const db = new DB(StorageInterface);
  const usermanager = new UserManager(db);

  await usermanager.login(user.email, user.password);

  await usermanager.getSessions();
}, 30000);
