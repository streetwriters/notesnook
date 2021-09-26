import http from "../utils/http";
import constants from "../utils/constants";
import { EV, EVENTS } from "../common";

const ENDPOINTS = {
  token: "/connect/token",
  revoke: "/connect/revocation",
  temporaryToken: "/account/token",
  logout: "/account/logout",
};

var isRefreshingToken = false;
class TokenManager {
  /**
   *
   * @param {import("../database/storage").default} storage
   */
  constructor(storage) {
    this._storage = storage;
  }

  async getToken(renew = true, forceRenew = false) {
    let token = await this._storage.read("token");
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
        EV.publish(EVENTS.userSessionExpired);
      }
      throw e;
    }
  }

  async _refreshToken(token) {
    const { refresh_token, scope } = token;
    if (!refresh_token || !scope) return;

    if (isRefreshingToken) {
      return new Promise((resolve, reject) => {
        EV.subscribe(EVENTS.tokenRefreshed, onTokenRefreshed, true);

        function onTokenRefreshed({ success, error }) {
          clearTimeout(timeout);
          if (success) return resolve();
          else return reject(error);
        }

        const timeout = setTimeout(() => {
          EV.unsubscribe(EVENTS.tokenRefreshed, onTokenRefreshed);
          reject("Timeout while refreshing token.");
        }, 15000);
      });
    }

    isRefreshingToken = true;
    try {
      await this.saveToken(
        await http.post(`${constants.AUTH_HOST}${ENDPOINTS.token}`, {
          refresh_token,
          grant_type: "refresh_token",
          scope: scope,
          client_id: "notesnook",
        })
      );
      EV.publish(EVENTS.tokenRefreshed, { success: true });
    } catch (e) {
      EV.publish(EVENTS.tokenRefreshed, {
        success: false,
        error: e,
      });
      console.error("Failed to refresh token:", e);
      throw e;
    } finally {
      isRefreshingToken = false;
    }
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
    let token = { ...tokenResponse, t: Date.now() };
    return this._storage.write("token", token);
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
