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

import { KVStorageAccessor } from "../../interfaces.js";
import hosts from "../../utils/constants.js";
import http from "../../utils/http.js";
import { getId } from "../../utils/id.js";
import TokenManager from "../token-manager.js";

export class SyncDevices {
  constructor(
    private readonly kv: KVStorageAccessor,
    private readonly tokenManager: TokenManager
  ) {}

  async register() {
    const deviceId = getId();
    const url = `${hosts.API_HOST}/devices?deviceId=${deviceId}`;
    const token = await this.tokenManager.getAccessToken();
    return http
      .post(url, null, token)
      .then(() => this.kv().write("deviceId", deviceId));
  }

  async unregister() {
    const deviceId = await this.kv().read("deviceId");
    if (!deviceId) return;
    const url = `${hosts.API_HOST}/devices?deviceId=${deviceId}`;
    const token = await this.tokenManager.getAccessToken();
    return http.delete(url, token).then(() => this.kv().delete("deviceId"));
  }

  get() {
    return this.kv().read("deviceId");
  }
}
