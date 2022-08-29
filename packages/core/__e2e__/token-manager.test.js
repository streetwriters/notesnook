import DB from "../api";
import StorageInterface from "../__mocks__/storage.mock";

const user = {
  email: process.env.EMAIL,
  password: process.env.PASSWORD,
  hashedPassword: process.env.HASHED_PASSWORD,
};

test("refresh token concurrently", async () => {
  const db = new DB(StorageInterface);
  await db.init();

  await expect(
    db.user.login(user.email, user.password, user.hashedPassword)
  ).resolves.not.toThrow();

  const token = await db.user.tokenManager.getToken();
  expect(token).toBeDefined();

  expect(
    await Promise.all([
      db.user.tokenManager._refreshToken(true),
      db.user.tokenManager._refreshToken(true),
      db.user.tokenManager._refreshToken(true),
      db.user.tokenManager._refreshToken(true),
    ])
  ).toHaveLength(4);
}, 30000);

test("refresh token using the same refresh_token multiple time", async () => {
  const db = new DB(StorageInterface);
  await db.init();

  await expect(
    db.user.login(user.email, user.password, user.hashedPassword)
  ).resolves.not.toThrow();

  const token = await db.user.tokenManager.getToken();
  expect(token).toBeDefined();
  for (let i = 0; i <= 5; ++i) {
    await db.user.tokenManager._refreshToken(true);
    await db.user.tokenManager.saveToken(token);
  }
}, 30000);
