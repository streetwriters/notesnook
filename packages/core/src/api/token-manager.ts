/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import http from "../utils/http.js";
import constants from "../utils/constants.js";
import { EV, EVENTS } from "../common.js";
import { withTimeout, Mutex } from "async-mutex";
import { logger } from "../logger.js";
import { KVStorageAccessor } from "../interfaces.js";

export type Token = {
  access_token: string;
  t: number;
  expires_in: number;
  scope: string;
  refresh_token: string;
};

type Scope = (typeof SCOPES)[number];

const SCOPES = [
  "notesnook.sync",
  "offline_access",
  "IdentityServerApi",
  "auth:grant_types:mfa",
  "auth:grant_types:mfa_password"
] as const;
const ENDPOINTS = {
  token: "/connect/token",
  revoke: "/connect/revocation",
  temporaryToken: "/account/token",
  logout: "/account/logout"
};
const REFRESH_TOKEN_MUTEX = withTimeout(
  new Mutex(),
  10 * 1000,
  new Error("Timed out while refreshing access token.")
);

class TokenManager {
  logger = logger.scope("TokenManager");
  constructor(private readonly storage: KVStorageAccessor) {}

  async getToken(renew = true, forceRenew = false): Promise<Token | undefined> {
    const token = await this.storage().read("token");
    if (!token || !token.access_token) return;

    this.logger.info("Access token requested", {
      accessToken: token.access_token.slice(0, 10)
    });

    const isExpired = renew && this._isTokenExpired(token);
    if (this._isTokenRefreshable(token) && (forceRenew || isExpired)) {
      await this._refreshToken(forceRenew);
      return await this.getToken(false, false);
    }

    return token;
  }

  _isTokenExpired(token: Token) {
    const { t, expires_in } = token;
    const expiryMs = t + expires_in * 1000;
    return Date.now() >= expiryMs;
  }

  _isTokenRefreshable(token: Token) {
    const { scope, refresh_token } = token;
    if (!refresh_token || !scope) return false;

    const scopes = scope.split(" ");
    return scopes.includes("offline_access") && Boolean(refresh_token);
  }

  async getAccessToken(
    scopes: Scope[] = ["notesnook.sync", "IdentityServerApi"],
    forceRenew = false
  ) {
    return await getSafeToken(async () => {
      const token = await this.getToken(true, forceRenew);
      if (!token || !token.scope) return;
      if (!scopes.some((s) => token.scope.includes(s))) return;
      return token.access_token;
    }, "Error getting access token:");
  }

  async _refreshToken(forceRenew = false) {
    await REFRESH_TOKEN_MUTEX.runExclusive(async () => {
      this.logger.info("Refreshing access token");

      const token = await this.getToken(false, false);
      if (!token) throw new Error("No access token found to refresh.");
      if (!forceRenew && !this._isTokenExpired(token)) {
        return;
      }

      const { refresh_token, scope } = token;
      if (!refresh_token || !scope) {
        EV.publish(EVENTS.userSessionExpired);
        this.logger.error(new Error("Token not found."));
        return;
      }

      const refreshTokenResponse = await http.post(
        `${constants.AUTH_HOST}${ENDPOINTS.token}`,
        {
          refresh_token,
          grant_type: "refresh_token",
          scope: scope,
          client_id: "notesnook"
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

    await this.storage().delete("token");
    await http.post(
      `${constants.AUTH_HOST}${ENDPOINTS.logout}`,
      null,
      access_token
    );
  }

  saveToken(tokenResponse: Omit<Token, "t">) {
    this.logger.info("Saving new token", tokenResponse);
    if (!tokenResponse || !tokenResponse.access_token) return;
    const token: Token = { ...tokenResponse, t: Date.now() };
    return this.storage().write("token", token);
  }

  async getAccessTokenFromAuthorizationCode(userId: string, authCode: string) {
    return await this.saveToken(
      await http.post(`${constants.AUTH_HOST}${ENDPOINTS.temporaryToken}`, {
        authorization_code: authCode,
        user_id: userId,
        client_id: "notesnook"
      })
    );
  }
}
export default TokenManager;

async function getSafeToken<T>(action: () => Promise<T>, errorMessage: string) {
  try {
    return await action();
  } catch (e) {
    logger.error(e, errorMessage);
    if (
      e instanceof Error &&
      (e.message === "invalid_grant" || e.message === "invalid_client")
    ) {
      EV.publish(EVENTS.userSessionExpired);
    }
    throw e;
  }
}
