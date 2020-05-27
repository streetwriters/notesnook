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
    user = await authRequest.call(this, "users", undefined, true, true);
    delete user.lastSynced;
    await this.set(user);
  }

  get() {
    return this._context.read("user");
  }

  async key() {
    const user = await this.get();
    if (!user) return;
    return { key: user.key, salt: user.salt };
  }

  async upgrade(refno) {
    const user = await this.get();
    if (!user || !refno) return;

    await this.set({ refno, upgrading: true });
    let response = await authRequest.call(this, "upgrade", { refno }, true);
    if (response.duration) {
      await this.set({
        refno: undefined,
        trialExpiryDate: response.duration,
        upgrading: undefined,
      });
    }
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
    const key = await this._context.deriveKey(password, response.payload.salt);
    let user = userFromResponse(response, key);
    await this._context.write("user", user);
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

    user = {
      ...user,
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiry: Date.now() + response.expiry * 100,
    };
    await this._context.write("user", user);
  }

  logout() {
    this._db.ev.publish("clear");
    return this._context.clear();
  }

  async signup(username, email, password) {
    let response = await authRequest("auth/register", {
      username,
      password,
      email,
    });
    const key = await this._context.deriveKey(password, response.payload.salt);
    let user = userFromResponse(response, key);
    await this._context.write("user", user);
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

  let response = await fetch(`${HOST}${endpoint}`, {
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
