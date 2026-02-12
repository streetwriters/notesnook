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

import { InboxApiKey } from "../types.js";
import http from "../utils/http.js";
import constants from "../utils/constants.js";
import TokenManager from "./token-manager.js";
import Database from "./index.js";

const ENDPOINTS = {
  inboxApiKeys: "/inbox/api-keys"
};

export class InboxApiKeys {
  constructor(
    private readonly db: Database,
    private readonly tokenManager: TokenManager
  ) {}

  async get() {
    const user = await this.db.user.getUser();
    if (!user) return;

    const token = await this.tokenManager.getAccessToken();
    if (!token) return;

    const inboxApiKeys = await http.get(
      `${constants.API_HOST}${ENDPOINTS.inboxApiKeys}`,
      token
    );
    return inboxApiKeys as InboxApiKey[];
  }

  async revoke(key: string) {
    const user = await this.db.user.getUser();
    if (!user) return;

    const token = await this.tokenManager.getAccessToken();
    if (!token) return;

    await http.delete(
      `${constants.API_HOST}${ENDPOINTS.inboxApiKeys}/${key}`,
      token
    );
  }

  async create(name: string, expiryDuration: number) {
    const user = await this.db.user.getUser();
    if (!user) return;

    const token = await this.tokenManager.getAccessToken();
    if (!token) return;

    const payload: Omit<InboxApiKey, "lastUsedAt" | "key" | "dateCreated"> = {
      name,
      expiryDate: expiryDuration === -1 ? -1 : Date.now() + expiryDuration
    };
    await http.post.json(
      `${constants.API_HOST}${ENDPOINTS.inboxApiKeys}`,
      payload,
      token
    );
  }
}
