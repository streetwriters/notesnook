import User from "../user";
import { enableFetchMocks, disableFetchMocks } from "jest-fetch-mock";
import StorageInterface from "../../__mocks__/storage.mock";

const SUCCESS_LOGIN_RESPONSE = {
  access_token: "access_token",
  refresh_token: "refresh_token",
  payload: {
    username: "thecodrr",
    email: process.env.EMAIL,
  },
  scopes: "sync",
  expiry: 36000,
};

beforeAll(() => {
  enableFetchMocks();
});

beforeEach(() => {
  fetch.resetMocks();
  StorageInterface.clear();
});

test("no user should be returned when not logged in", async () => {
  const user = new User(StorageInterface);
  expect(await user.get()).toBeUndefined();
});

test("undefined user should not be set", async () => {
  const user = new User(StorageInterface);
  await user.set();
  expect(await user.get()).toBeUndefined();
});

test("change email of user", async () => {
  fetch.mockResponseOnce(JSON.stringify(SUCCESS_LOGIN_RESPONSE));
  const user = new User(StorageInterface);
  await user.login("myuser", "mylogin");
  await user.set({ email: "newemail@gmail.com" });
  const dbuser = await user.get();
  expect(dbuser.email).toBe("newemail@gmail.com");
});

test("login user", async () => {
  fetch.mockResponseOnce(JSON.stringify(SUCCESS_LOGIN_RESPONSE));
  const user = new User(StorageInterface);
  await user.login("myuser", "mylogin");
  const dbuser = await user.get();
  expect(dbuser.username).toBe(SUCCESS_LOGIN_RESPONSE.payload.username);
  expect(dbuser.email).toBe(SUCCESS_LOGIN_RESPONSE.payload.email);
  expect(dbuser.refreshToken).toBe(SUCCESS_LOGIN_RESPONSE.refresh_token);
  expect(dbuser.accessToken).toBe(SUCCESS_LOGIN_RESPONSE.access_token);
  expect(dbuser.scopes).toBe(SUCCESS_LOGIN_RESPONSE.scopes);
});

test("login user with wrong password", () => {
  fetch.mockResponseOnce(
    JSON.stringify({ error: "Username or password is incorrect." }),
    { status: 400 }
  );
  const user = new User(StorageInterface);
  return user.login("myuser", "wrongpassword").catch((err) => {
    expect(err.message).toBe("Username or password is incorrect.");
  });
});

test("failed login with unknown error", () => {
  fetch.mockResponseOnce(JSON.stringify({}), { status: 400 });
  const user = new User(StorageInterface);
  return user.login("myuser", "wrongpassword").catch((err) => {
    expect(err.message).toContain("Request failed with status code: ");
  });
});

test("signup user", async () => {
  fetch.mockResponseOnce(JSON.stringify(SUCCESS_LOGIN_RESPONSE));
  const user = new User(StorageInterface);
  await user.signup(
    SUCCESS_LOGIN_RESPONSE.payload.username,
    SUCCESS_LOGIN_RESPONSE.payload.email,
    "password"
  );
  const dbuser = await user.get();
  expect(dbuser.username).toBe(SUCCESS_LOGIN_RESPONSE.payload.username);
  expect(dbuser.email).toBe(SUCCESS_LOGIN_RESPONSE.payload.email);
  expect(dbuser.refreshToken).toBe(SUCCESS_LOGIN_RESPONSE.refresh_token);
  expect(dbuser.accessToken).toBe(SUCCESS_LOGIN_RESPONSE.access_token);
  expect(dbuser.scopes).toBe(SUCCESS_LOGIN_RESPONSE.scopes);
});

test("logout user", async () => {
  fetch.mockResponseOnce(JSON.stringify(SUCCESS_LOGIN_RESPONSE));
  const user = new User(StorageInterface);
  await user.login("myuser", "mylogin");
  const dbuser = await user.get();
  expect(dbuser.username).toBe(SUCCESS_LOGIN_RESPONSE.payload.username);
  await user.logout();
  expect(await user.get()).toBeUndefined();
});

test("refresh user's token", async () => {
  fetch.mockResponseOnce(
    JSON.stringify({ ...SUCCESS_LOGIN_RESPONSE, expiry: -2000 })
  );
  const user = new User(StorageInterface);
  await user.login("myuser", "mylogin");
  fetch.mockResponseOnce(
    JSON.stringify({
      access_token: "new_token",
      refresh_token: "new_refresh_token",
    })
  );
  await user.token();
  const dbuser = await user.get();
  expect(dbuser.refreshToken).toBe("new_refresh_token");
  expect(dbuser.accessToken).toBe("new_token");
});

test("refreshing token when user has no access token should remove user", async () => {
  fetch.mockResponseOnce(
    JSON.stringify({
      ...SUCCESS_LOGIN_RESPONSE,
      expiry: -2000,
      access_token: false,
    })
  );
  const user = new User(StorageInterface);
  await user.login("myuser", "mylogin");
  await user.token();
  const dbuser = await user.get();
  expect(dbuser).toBeUndefined();
});

test("refresh user's token when its not expired", async () => {
  fetch.mockResponseOnce(JSON.stringify(SUCCESS_LOGIN_RESPONSE));
  const user = new User(StorageInterface);
  await user.login("myuser", "mylogin");
  expect(await user.token()).toBe("access_token");
  const dbuser = await user.get();
  expect(dbuser.refreshToken).toBe("refresh_token");
  expect(dbuser.accessToken).toBe("access_token");
});

test("refresh token for non existent user should do nothing", async () => {
  fetch.mockResponseOnce(JSON.stringify(SUCCESS_LOGIN_RESPONSE));
  const user = new User(StorageInterface);
  expect(await user.token()).toBeUndefined();
  const dbuser = await user.get();
  expect(dbuser).toBeUndefined();
});
