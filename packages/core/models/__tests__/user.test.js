import User from "../user";
import { enableFetchMocks, disableFetchMocks } from "jest-fetch-mock";
import { StorageInterface, databaseTest } from "../../__tests__/utils/index";

const SUCCESS_LOGIN_RESPONSE = {
  access_token: "access_token",
  refresh_token: "refresh_token",
  payload: {
    username: "thecodrr",
    email: process.env.EMAIL,
  },
  expiry: 36000,
};

beforeAll(() => {
  enableFetchMocks();
});

beforeEach(() => {
  fetch.resetMocks();
  StorageInterface.clear();
});

test("no user should be returned when not logged in", () =>
  databaseTest().then(async (db) => {
    expect(await db.user.get()).toBeUndefined();
  }));

test("undefined user should not be set", () =>
  databaseTest().then(async (db) => {
    await db.user.set();
    expect(await db.user.get()).toBeUndefined();
  }));

test("change email of user", async () =>
  databaseTest().then(async (db) => {
    fetch.mockResponseOnce(JSON.stringify(SUCCESS_LOGIN_RESPONSE));
    await db.user.login("myuser", "mylogin");
    await db.user.set({ email: "newemail@gmail.com" });
    const dbuser = await db.user.get();
    expect(dbuser.email).toBe("newemail@gmail.com");
  }));

test("login user", async () =>
  databaseTest().then(async (db) => {
    fetch.mockResponseOnce(JSON.stringify(SUCCESS_LOGIN_RESPONSE));
    await db.user.login("myuser", "mylogin");
    const dbuser = await db.user.get();
    expect(dbuser.username).toBe(SUCCESS_LOGIN_RESPONSE.payload.username);
    expect(dbuser.email).toBe(SUCCESS_LOGIN_RESPONSE.payload.email);
    expect(dbuser.refreshToken).toBe(SUCCESS_LOGIN_RESPONSE.refresh_token);
    expect(dbuser.accessToken).toBe(SUCCESS_LOGIN_RESPONSE.access_token);
    expect(dbuser.scopes).toBe(SUCCESS_LOGIN_RESPONSE.scopes);
  }));

test("login user with wrong password", () =>
  databaseTest().then(async (db) => {
    fetch.mockResponseOnce(
      JSON.stringify({ error: "Username or password is incorrect." }),
      { status: 400 }
    );
    await expect(db.user.login("myuser", "wrongpassword")).rejects.toThrow(
      /Username or password is incorrect./
    );
  }));

test("failed login with unknown error", () =>
  databaseTest().then(async (db) => {
    fetch.mockResponseOnce(JSON.stringify({}), { status: 400 });
    await expect(db.user.login("myuser", "wrongpassword")).rejects.toThrow(
      /Request failed with status code: /
    );
  }));

test("signup user", () =>
  databaseTest().then(async (db) => {
    fetch.mockResponseOnce(JSON.stringify(SUCCESS_LOGIN_RESPONSE));
    await db.user.signup(
      SUCCESS_LOGIN_RESPONSE.payload.username,
      SUCCESS_LOGIN_RESPONSE.payload.email,
      "password"
    );
    const dbuser = await db.user.get();
    expect(dbuser.username).toBe(SUCCESS_LOGIN_RESPONSE.payload.username);
    expect(dbuser.email).toBe(SUCCESS_LOGIN_RESPONSE.payload.email);
    expect(dbuser.refreshToken).toBe(SUCCESS_LOGIN_RESPONSE.refresh_token);
    expect(dbuser.accessToken).toBe(SUCCESS_LOGIN_RESPONSE.access_token);
    expect(dbuser.scopes).toBe(SUCCESS_LOGIN_RESPONSE.scopes);
  }));

test("logout user", () =>
  databaseTest().then(async (db) => {
    fetch.mockResponseOnce(JSON.stringify(SUCCESS_LOGIN_RESPONSE));
    await db.user.login("myuser", "mylogin");
    const dbuser = await db.user.get();
    expect(dbuser.username).toBe(SUCCESS_LOGIN_RESPONSE.payload.username);
    await db.user.logout();
    expect(await db.user.get()).toBeUndefined();
  }));

test("refresh user's token", () =>
  databaseTest().then(async (db) => {
    fetch.mockResponseOnce(
      JSON.stringify({ ...SUCCESS_LOGIN_RESPONSE, expiry: -2000 })
    );
    await db.user.login("myuser", "mylogin");
    fetch.mockResponseOnce(
      JSON.stringify({
        access_token: "new_token",
        refresh_token: "new_refresh_token",
      })
    );
    await db.user.token();
    const dbuser = await db.user.get();
    expect(dbuser.refreshToken).toBe("new_refresh_token");
    expect(dbuser.accessToken).toBe("new_token");
  }));

test("refreshing token when user has no access token should remove user", () =>
  databaseTest().then(async (db) => {
    fetch.mockResponseOnce(
      JSON.stringify({
        ...SUCCESS_LOGIN_RESPONSE,
        expiry: -2000,
        access_token: false,
      })
    );
    await db.user.login("myuser", "mylogin");
    await db.user.token();
    const dbuser = await db.user.get();
    expect(dbuser).toBeUndefined();
  }));

test("refresh user's token when its not expired", () =>
  databaseTest().then(async (db) => {
    fetch.mockResponseOnce(JSON.stringify(SUCCESS_LOGIN_RESPONSE));
    await db.user.login("myuser", "mylogin");
    expect(await db.user.token()).toBe("access_token");
    const dbuser = await db.user.get();
    expect(dbuser.refreshToken).toBe("refresh_token");
    expect(dbuser.accessToken).toBe("access_token");
  }));

test("refresh token for non existent user should do nothing", () =>
  databaseTest().then(async (db) => {
    fetch.mockResponseOnce(JSON.stringify(SUCCESS_LOGIN_RESPONSE));
    expect(await db.user.token()).toBeUndefined();
    const dbuser = await db.user.get();
    expect(dbuser).toBeUndefined();
  }));
