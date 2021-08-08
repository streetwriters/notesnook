const fetch = require("node-fetch");
window.fetch = fetch;
import UserManager from "../api/user-manager";
import DB from "../api";
import StorageInterface from "../__mocks__/storage.mock";

const user = {
  email: process.env.EMAIL,
  password: process.env.PASSWORD,
  hashedPassword: process.env.HASHED_PASSWORD,
};

test("refresh token concurrently", async () => {
  const db = new DB(StorageInterface);
  const usermanager = new UserManager(db);

  await expect(
    usermanager.login(user.email, user.password, user.hashedPassword)
  ).resolves.not.toThrow();

  const token = await usermanager.tokenManager.getToken();
  expect(token).toBeDefined();

  expect(
    await Promise.all([
      usermanager.tokenManager._refreshToken(token),
      usermanager.tokenManager._refreshToken(token),
      usermanager.tokenManager._refreshToken(token),
      usermanager.tokenManager._refreshToken(token),
    ])
  ).toHaveLength(4);
}, 30000);
