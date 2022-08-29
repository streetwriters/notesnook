import http from "../utils/http";
import constants from "../utils/constants";
import { EV, EVENTS } from "../common";
import { withTimeout, Mutex } from "async-mutex";
import { logger } from "../logger";

const ENDPOINTS = {
  token: "/connect/token",
  revoke: "/connect/revocation",
  temporaryToken: "/account/token",
  logout: "/account/logout",
};

class TokenManager {
  /**
   *
   * @param {import("../database/storage").default} storage
   */
  constructor(storage) {
    this._storage = storage;
    this._refreshTokenMutex = withTimeout(new Mutex(), 10 * 1000);
    this.logger = logger.scope("TokenManager");
  }

  async getToken(renew = true, forceRenew = false) {
    let token = await this._storage.read("token");
    if (!token) return;

    this.logger.info("Access token requested", {
      accessToken: token.access_token.slice(0, 10),
    });

    if (forceRenew || (renew && this._isTokenExpired(token))) {
      await this._refreshToken(forceRenew);
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
    return await getSafeToken(async () => {
      const token = await this.getToken(true, forceRenew);
      if (!token) return;
      return token.access_token;
    }, "Error getting access token:");
  }

  async _refreshToken(forceRenew = false) {
    await this._refreshTokenMutex.runExclusive(async () => {
      this.logger.info("Refreshing access token");

      const token = await this.getToken(false, false);
      if (!forceRenew && !this._isTokenExpired(token)) {
        return;
      }

      const { refresh_token, scope } = token;
      if (!refresh_token || !scope) return;

      const refreshTokenResponse = await await http.post(
        `${constants.AUTH_HOST}${ENDPOINTS.token}`,
        {
          refresh_token,
          grant_type: "refresh_token",
          scope: scope,
          client_id: "notesnook",
        }
      );
      await this.saveToken(refreshTokenResponse);
      EV.publish(EVENTS.tokenRefreshed);
    });
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

async function getSafeToken(action, errorMessage) {
  try {
    return await action();
  } catch (e) {
    console.error(errorMessage, e);
    if (e.message === "invalid_grant" || e.message === "invalid_client") {
      EV.publish(EVENTS.userSessionExpired);
    }
    throw e;
  }
}
