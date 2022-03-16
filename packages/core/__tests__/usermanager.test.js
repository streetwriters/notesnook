import { enableFetchMocks, disableFetchMocks } from "jest-fetch-mock";
import { StorageInterface, databaseTest } from "./utils";

const SUCCESS_LOGIN_RESPONSE = {
  access_token: "access_token",
  refresh_token: "refresh_token",

  scope: "sync",
  expires_in: 3600,
};

const SUCCESS_USER_RESPONSE = {
  id: "0",
  email: process.env.EMAIL,
  salt: "",
};

function mock(expiry = 3600) {
  fetch
    .mockResponseOnce(
      JSON.stringify({ ...SUCCESS_LOGIN_RESPONSE, expires_in: expiry }),
      {
        headers: { "Content-Type": "application/json" },
      }
    )
    .mockResponseOnce(JSON.stringify(SUCCESS_USER_RESPONSE), {
      headers: { "Content-Type": "application/json" },
    });
}

beforeAll(() => {
  enableFetchMocks();
});

beforeEach(() => {
  fetch.resetMocks();
  StorageInterface.clear();
});

test("no user should be returned when not logged in", () =>
  databaseTest().then(async (db) => {
    expect(await db.user.getUser()).toBeUndefined();
  }));

test("undefined user should not be set", () =>
  databaseTest().then(async (db) => {
    await db.user.setUser();
    expect(await db.user.getUser()).toBeUndefined();
  }));

test("login user", async () =>
  databaseTest().then(async (db) => {
    mock();
    await db.user.login("myuser", "mylogin", true, "mylogin");
    const dbuser = await db.user.getUser();
    expect(dbuser.email).toBe(SUCCESS_USER_RESPONSE.email);
    expect(dbuser.id).toBe(SUCCESS_USER_RESPONSE.id);
  }));

test("login user with wrong password", () =>
  databaseTest().then(async (db) => {
    fetch.mockResponseOnce(
      JSON.stringify({
        error_description: "Username or password is incorrect.",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
    await expect(
      db.user.login("myuser", "wrongpassword", true, "wrongpassword")
    ).rejects.toThrow(/Username or password is incorrect./);
  }));

test("failed login with unknown error", () =>
  databaseTest().then(async (db) => {
    fetch.mockResponseOnce(JSON.stringify({}), { status: 400 });
    await expect(
      db.user.login("myuser", "wrongpassword", true, "wrongpassword")
    ).rejects.toThrow(/Request failed with status code: /);
  }));

test("signup user", () =>
  databaseTest().then(async (db) => {
    fetch.mockResponseOnce(undefined, { status: 200 });
    mock();
    await db.user.signup(SUCCESS_USER_RESPONSE.email, "password");
    const dbuser = await db.user.getUser();
    expect(dbuser.email).toBe(SUCCESS_USER_RESPONSE.email);
  }));

test("logout user", () =>
  databaseTest().then(async (db) => {
    mock();
    await db.user.login("myuser", "mylogin", true, "mylogin");
    const dbuser = await db.user.getUser();
    expect(dbuser.email).toBe(SUCCESS_USER_RESPONSE.email);
    await db.user.logout();
    expect(await db.user.getUser()).toBeUndefined();
  }));

test("refresh user's token", () =>
  databaseTest().then(async (db) => {
    mock();
    await db.user.login(
      SUCCESS_USER_RESPONSE.email,
      "mylogin",
      true,
      "mylogin"
    );
    const token = await db.user.tokenManager.getToken();
    await db.user.tokenManager.saveToken({ ...token, expires_in: -2000 });
    fetch.mockResponseOnce(
      JSON.stringify({
        ...SUCCESS_LOGIN_RESPONSE,
        access_token: "new_token",
        refresh_token: "new_refresh_token",
        expires_in: 3600,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    const { access_token, refresh_token } =
      await db.user.tokenManager.getToken();
    expect(refresh_token).toBe("new_refresh_token");
    expect(access_token).toBe("new_token");
  }));

test("refresh user's token when its not expired", () =>
  databaseTest().then(async (db) => {
    mock();
    await db.user.login(
      SUCCESS_USER_RESPONSE.email,
      "mylogin",
      true,
      "mylogin"
    );
    expect(await db.user.tokenManager.getAccessToken()).toBe("access_token");
    const dbuser = await db.user.getUser();
    expect(dbuser.email).toBe(SUCCESS_USER_RESPONSE.email);
  }));

test("refresh token for non existent user should do nothing", () =>
  databaseTest().then(async (db) => {
    fetch.mockResponseOnce(JSON.stringify(SUCCESS_LOGIN_RESPONSE));
    expect(await db.user.tokenManager.getAccessToken()).toBeUndefined();
    const dbuser = await db.user.getUser();
    expect(dbuser).toBeUndefined();
  }));
