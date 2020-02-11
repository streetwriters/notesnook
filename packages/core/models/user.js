import { HOST, HEADERS } from "../utils/constants";
import StorageInterface from "../database/storage";
import fetch from "node-fetch";

export default class User {
  /**
   *
   * @param {StorageInterface} context
   */
  constructor(context) {
    this.context = context;
  }

  async user() {
    return this.context.read("user");
  }

  async login(username, password) {
    let response = await authRequest("oauth/token", {
      username,
      password,
      grant_type: "password"
    });
    let user = userFromResponse(response);
    await this.context.write("user", user);
  }

  async refreshToken() {
    let user = await this.user();
    if (!user) return false;
    if (user.expiry < Date.now()) {
      return true;
    }
    let response = await authRequest("oauth/token", {
      refresh_token: user.refreshToken,
      grant_type: "refresh_token"
    });
    var dt = new Date();
    dt.setDate(dt.getDate() + 1);
    user = {
      ...user,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiry: dt.getTime()
    };
    await this.context.write("user", user);
    return true;
  }

  logout() {
    this.context.clear();
  }

  async signup(username, email, password) {
    let response = await authRequest("auth/register", {
      username,
      password,
      email
    });
    let user = userFromResponse(response);
    await this.context.write(user.username, user);
  }
}

function userFromResponse(response) {
  var dt = new Date();
  dt.setDate(dt.getDate() + 1);
  let user = {
    ...response.payload,
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    scopes: response.scopes,
    expiry: dt.getTime()
  };
  return user;
}

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
