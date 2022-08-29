import { databaseTest } from "../__tests__/utils";

const user = {
  email: process.env.EMAIL,
  password: process.env.PASSWORD,
  hashed: process.env.HASHED_PASSWORD,
};

// test("signup user and check for token", async () => {
//   const db = new DB(StorageInterface);
//   const usermanager = new UserManager(db);

//   await expect(
//     usermanager.signup(user.email, user.password)
//   ).resolves.not.toThrow();

//   await expect(usermanager.tokenManager.getToken()).resolves.toBeDefined();
// }, 30000);

test(
  "login user and check for token",
  () =>
    databaseTest().then(async (db) => {
      await expect(
        db.user.login(user.email, user.password, user.hashed)
      ).resolves.not.toThrow();

      await expect(db.user.tokenManager.getToken()).resolves.toBeDefined();
    }),
  30000
);

test(
  "login user and get user data",
  () =>
    databaseTest().then(async (db) => {
      await db.user.login(user.email, user.password, user.hashed);

      const userData = await db.user.getUser();
      expect(userData.email).toBe(user.email);
    }),
  30000
);

test(
  "login user and logout user",
  () =>
    databaseTest().then(async (db) => {
      await db.user.login(user.email, user.password, user.hashed);

      await expect(db.user.logout()).resolves.not.toThrow();
    }),
  30000
);

// test("login user and delete user", async () => {
//   const db = new DB(StorageInterface);
//   const usermanager = new UserManager(db);

//   await usermanager.login(user.email, user.password, user.hashed);

//   await expect(usermanager.deleteUser(user.password)).resolves.toBe(true);
// }, 30000);

// test("login user and get user sessions", async () => {
//   const db = new DB(StorageInterface);
//   const usermanager = new UserManager(db);

//   await usermanager.login(user.email, user.password);

//   await usermanager.getSessions();
// }, 30000);
