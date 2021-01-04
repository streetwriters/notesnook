import http from "../utils/http";
import constants from "../utils/constants";

const ENDPOINTS = {
  token: "/connect/token",
  revoke: "/connect/revocation",
  temporaryToken: "/account/token",
  logout: "/account/logout",
};

class TokenManager {
  /**
   *
   * @param {import("./index").default} db
   */
  constructor(db) {
    this._db = db;
  }

  async getToken() {
    let token = await this._db.context.read("token");
    if (!token) return;
    if (this._isTokenExpired(token)) {
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

  async getAccessToken() {
    const token = await this.getToken();
    if (!token) return;
    return token.access_token;
  }

  async _refreshToken(token) {
    const { refresh_token, scope } = token;

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
    return this._db.context.write("token", { ...tokenResponse, t: Date.now() });
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
