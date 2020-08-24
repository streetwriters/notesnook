import { HOST, HEADERS } from "../utils/constants";

export default class User {
  /**
   *
   * @param {import("../api").default} db
   */
  constructor(db) {
    this._db = db;
    this._context = db.context;
  }

  async sync() {
    var user = await this.get();
    if (!user) return;
    var serverUser = await authRequest.call(
      this,
      "users",
      undefined,
      true,
      true
    );

    await this.set({
      ...user,
      ...serverUser,
      notesnook: { ...user.notesnook, ...serverUser.notesnook },
    });

    // propogate event
    this._db.ev.publish("user:synced", user);
  }

  get() {
    return this._context.read("user");
  }

  async key() {
    const user = await this.get();
    if (!user) return;
    return { key: user.key, salt: user.salt };
  }

  async set(user) {
    if (!user) return;
    user = { ...(await this.get()), ...user };
    await this._context.write("user", user);
  }

  async login(username, password) {
    let response = await authRequest("oauth/token", {
      username,
      password,
      grant_type: "password",
    });
    if (!response) return;
    const key = await this._context.deriveKey(password, response.payload.salt);
    let user = userFromResponse(response, key);
    await this._context.write("user", user);

    // propogate event
    this._db.ev.publish("user:loggedIn", user);
  }

  async token() {
    let user = await this.get();
    if (!user) return;
    if (!user.accessToken) {
      return await this._context.remove("user");
    }
    if (user.expiry > Date.now()) {
      return user.accessToken;
    }
    let response = await authRequest("oauth/token", {
      refresh_token: user.refreshToken,
      grant_type: "refresh_token",
    });
    if (!response) return;

    user = {
      ...user,
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiry: Date.now() + response.expiry * 100,
    };
    await this._context.write("user", user);

    // propogate event
    this._db.ev.publish("user:tokenRefreshed", user);
  }

  logout() {
    this._db.ev.publish("clear");

    // propogate event
    this._db.ev.publish("user:loggedOut", null);

    return this._context.clear();
  }

  async signup(username, email, password) {
    let response = await authRequest("auth/register", {
      username,
      password,
      email,
    });
    if (!response) return;
    const key = await this._context.deriveKey(password, response.payload.salt);
    let user = userFromResponse(response, key);
    await this._context.write("user", user);

    // propogate event
    this._db.ev.publish("user:loggedIn", user);
  }
}

function userFromResponse(response, key) {
  let user = {
    ...response.payload,
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    scopes: response.scopes,
    expiry: Date.now() + response.expiry * 100,
    key,
  };
  return user;
}

async function authRequest(endpoint, data, auth = false, get = false) {
  var headers = {};
  if (auth) {
    const token = await this.token();
    headers = {
      Authorization: `Bearer ${token}`,
    };
  }

  let response = await fetch(`${HOST}/${endpoint}`, {
    method: get ? "GET" : "POST",
    headers: { ...HEADERS, ...headers },
    body: get ? undefined : JSON.stringify(data),
  });

  if (response.ok) {
    let result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }
    return result;
  }

  let json = await response.json();
  let error =
    json.error ||
    `Request failed with status code: ${response.status} ${response.statusText}.`;
  throw new Error(error);
}
