import http from "../utils/http";
import constants from "../utils/constants";
import { EV, EVENTS, sendSessionExpiredEvent } from "../common";

const ENDPOINTS = {
  token: "/connect/token",
  revoke: "/connect/revocation",
  temporaryToken: "/account/token",
  logout: "/account/logout",
};

var RETRIES = 0;
var RETRIES_LIMIT = 1;
class TokenManager {
  /**
   *
   * @param {import("./index").default} db
   */
  constructor(db) {
    this._db = db;
    this.token;
  }

  async getToken(renew = true, forceRenew = false) {
    let token = this.token || (await this._db.context.read("token"));
    if (!token) return;
    if (forceRenew || (renew && this._isTokenExpired(token))) {
      await this._refreshToken(token);
      return await this.getToken();
    }
    return token;
  }

  _isTokenExpired(token) {
    const { t, expires_in } = token;
    const expiryMs = t + expires_in * 1000;
    return Date.now() >= expiryMs;
  }

  async getAccessToken(forceRenew = false) {
    try {
      const token = await this.getToken(true, forceRenew);
      if (!token) return;
      return token.access_token;
    } catch (e) {
      console.error("Error getting access token:", e);
      if (e.message === "invalid_grant" || e.message === "invalid_client") {
        if (++RETRIES <= RETRIES_LIMIT) {
          return await this.getAccessToken(true);
        }
        RETRIES = 0;
        EV.publish(EVENTS.userSessionExpired);
      }
      return null;
    }
  }

  async _refreshToken(token) {
    const { refresh_token, scope } = token;

    if (!refresh_token || !scope) return;
    return await this.saveToken(
      await http.post(`${constants.AUTH_HOST}${ENDPOINTS.token}`, {
        refresh_token,
        grant_type: "refresh_token",
        scope: scope,
        client_id: "notesnook",
      })
    );
  }

  async revokeToken() {
    const token = await this.getToken();
    if (!token) return;
    const { access_token } = token;

    await http.post(
      `${constants.AUTH_HOST}${ENDPOINTS.logout}`,
      null,
      access_token
    );
  }

  saveToken(tokenResponse) {
    this.token = { ...tokenResponse, t: Date.now() };
    return this._db.context.write("token", this.token);
  }

  clearToken() {
    this.token = undefined;
  }

  async getAccessTokenFromAuthorizationCode(userId, authCode) {
    return await this.saveToken(
      await http.post(`${constants.AUTH_HOST}${ENDPOINTS.temporaryToken}`, {
        authorization_code: authCode,
        user_id: userId,
        client_id: "notesnook",
      })
    );
  }
}
export default TokenManager;
