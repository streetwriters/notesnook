import { HOST, HEADERS } from "./constants";
//var Database = require("./database").default;
import fetch from "node-fetch";

async function authRequest(endpoint, data) {
  let response = await fetch(`${HOST}${endpoint}`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(data)
  });

  let json = await response.json();
  if (response.ok) {
    if (json.error) {
      throw new Error(json.error);
    }
    return json;
  }

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
  db;
  constructor(db) {
    this.db = db;
    if (!this.db) {
      throw new Error("db cannot be undefined.");
    }
  }

  async login(data) {
    let response = await authRequest("oauth/token", {
      ...data,
      grant_type: "password"
    });
    return await saveUser.call(this, response);
  }

  async refreshToken() {
    let user = this.db.getUser();
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

  async signup(data) {
    let response = await authRequest("auth/register", data);
    return await saveUser.call(this, response);
  }
}
