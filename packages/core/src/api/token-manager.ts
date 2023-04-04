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

import http from "../utils/http";
import constants from "../utils/constants";
import { EV, EVENTS } from "../common";
import { withTimeout, Mutex } from "async-mutex";
import { logger } from "../logger";
import { IStorage } from "../interfaces";
import { ILogger } from "@notesnook/logger";

type AccessToken = {
  access_token: string;
  scope: string;
  refresh_token: string;
  t: number;
  expires_in: number;
};

const ENDPOINTS = {
  token: "/connect/token",
  revoke: "/connect/revocation",
  temporaryToken: "/account/token",
  logout: "/account/logout"
};

export interface ITokenManager {
  getAccessToken(forceRenew?: boolean): Promise<string | undefined>;
}

export class TokenManager implements ITokenManager {
  private readonly refreshTokenMutex = withTimeout(new Mutex(), 10 * 1000);
  private readonly logger: ILogger;

  constructor(private readonly storage: IStorage) {
    this.logger = logger.scope("TokenManager");
  }

  async getToken(
    renew = true,
    forceRenew = false
  ): Promise<AccessToken | undefined> {
    const token = await this.storage.read<AccessToken>("token");
    if (!token || !token.access_token) return;

    this.logger.info("Access token requested", {
      accessToken: token.access_token.slice(0, 10)
    });

    const isExpired = renew && this.isTokenExpired(token);
    if (this.isTokenRefreshable(token) && (forceRenew || isExpired)) {
      await this.refreshToken(forceRenew);
      return await this.getToken(false, false);
    }

    return token;
  }

  private isTokenExpired(token: AccessToken) {
    const { t, expires_in } = token;
    const expiryMs = t + expires_in * 1000;
    return Date.now() >= expiryMs;
  }

  private isTokenRefreshable(token: AccessToken) {
    const { scope, refresh_token } = token;
    if (!refresh_token || !scope) return false;

    const scopes = scope.split(" ");
    return scopes.includes("offline_access") && Boolean(refresh_token);
  }

  async getAccessToken(forceRenew = false) {
    return await getSafeToken(async () => {
      const token = await this.getToken(true, forceRenew);
      if (!token) return;
      return token.access_token;
    }, "Error getting access token:");
  }

  private async refreshToken(forceRenew = false) {
    await this.refreshTokenMutex.runExclusive(async () => {
      this.logger.info("Refreshing access token");

      const token = await this.getToken(false, false);
      if (!token || (!forceRenew && !this.isTokenExpired(token))) {
        return;
      }

      const { refresh_token, scope } = token;
      if (!refresh_token || !scope) {
        throw new Error("Token not found.");
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

    await http.post(
      `${constants.AUTH_HOST}${ENDPOINTS.logout}`,
      null,
      access_token
    );
  }

  private saveToken(tokenResponse: AccessToken) {
    if (!tokenResponse) return;
    const token = { ...tokenResponse, t: Date.now() };
    return this.storage.write("token", token);
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

async function getSafeToken<T>(action: () => Promise<T>, errorMessage: string) {
  try {
    return await action();
  } catch (e) {
    console.error(errorMessage, e);
    if (
      e instanceof Error &&
      (e.message === "invalid_grant" || e.message === "invalid_client")
    ) {
      EV.publish(EVENTS.userSessionExpired);
    }
    throw e;
  }
}
