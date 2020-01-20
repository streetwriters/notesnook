import { HOST, HEADERS } from "./constants";
const fetch = require("node-fetch");

async function authRequest(endpoint, data) {
  let response = await fetch(`${HOST}${endpoint}`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(data)
  });
  if (response.ok) {
    let result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }
    return result;
  }
  let json = await response.json();
  if (json.error) {
    throw new Error(json.error);
  } else {
    let error = `Request failed with status code: ${response.status} ${response.statusText}.`;
    throw new Error(error);
  }
}

async function saveUser(response) {
  var dt = new Date();
  dt.setDate(dt.getDate() + 1);
  let user = {
    ...response.payload,
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    scopes: response.scopes,
    expiry: dt.getTime()
  };
  await this.db.createUser(user);
  return this.db.getUser();
}

export default class Auth {
  constructor(db) {
    this.db = db;
    if (!this.db) {
      throw new Error("db cannot be undefined.");
    }
  }

  async login(username, password) {
    let response = await authRequest("oauth/token", {
      username,
      password,
      grant_type: "password"
    });
    return await saveUser.call(this, response);
  }

  async refreshToken() {
    let user = this.getUser();
    if (user.expiry < Date.now()) {
      return true;
    }
    let response = await authRequest("oauth/token", {
      refresh_token: user.refreshToken,
      grant_type: "refresh_token"
    });
    var dt = new Date();
    dt.setDate(dt.getDate() + 1);
    await this.db.createUser({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiry: dt.getTime()
    });
    return true;
  }

  async signup(username, email, password) {
    let response = await authRequest("auth/register", {
      username,
      password,
      email
    });
    return await saveUser.call(this, response);
  }
}
