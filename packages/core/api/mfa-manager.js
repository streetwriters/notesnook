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
import TokenManager from "./token-manager";

const ENDPOINTS = {
  setup: "/mfa",
  enable: "/mfa",
  disable: "/mfa",
  recoveryCodes: "/mfa/codes",
  send: "/mfa/send"
};

class MFAManager {
  /**
   *
   * @param {import("../database/storage").default} storage
   * @param {import("../api/index").default} db
   */
  constructor(storage, db) {
    this._storage = storage;
    this._db = db;
    this.tokenManager = new TokenManager(storage);
  }

  /**
   *
   * @param {"app" | "sms" | "email"} type
   * @param {string} phoneNumber
   * @returns
   */
  async setup(type, phoneNumber = undefined) {
    const token = await this.tokenManager.getAccessToken();
    if (!token) return;
    return await http.post(
      `${constants.AUTH_HOST}${ENDPOINTS.setup}`,
      {
        type,
        phoneNumber
      },
      token
    );
  }

  /**
   *
   * @param {"app" | "sms" | "email"} type
   * @param {string} code
   * @returns
   */
  async enable(type, code) {
    return this._enable(type, code, false);
  }

  /**
   *
   * @param {"app" | "sms" | "email"} type
   * @param {string} code
   * @returns
   */
  async enableFallback(type, code) {
    return this._enable(type, code, true);
  }

  /**
   *
   * @param {"app" | "sms" | "email"} type
   * @param {string} code
   * @param {boolean} isFallback
   * @private
   * @returns
   */
  async _enable(type, code, isFallback) {
    const token = await this.tokenManager.getAccessToken();
    if (!token) return;
    return await http.patch(
      `${constants.AUTH_HOST}${ENDPOINTS.enable}`,
      { type, code, isFallback },
      token
    );
  }

  async disable() {
    const token = await this.tokenManager.getAccessToken();
    if (!token) return;
    return await http.delete(
      `${constants.AUTH_HOST}${ENDPOINTS.disable}`,
      token
    );
  }

  /**
   * Generate new 2FA recovery codes or get count of valid recovery codes.
   * @param {boolean} generate
   * @returns
   */
  async codes() {
    const token = await this.tokenManager.getAccessToken();
    if (!token) return;
    return await http.get(
      `${constants.AUTH_HOST}${ENDPOINTS.recoveryCodes}`,
      token
    );
  }

  /**
   * @param {"sms" | "email"} method
   * @returns
   */
  async sendCode(method) {
    const token = await this.tokenManager.getAccessToken();
    if (!token) throw new Error("Unauthorized.");

    return await http.post(
      `${constants.AUTH_HOST}${ENDPOINTS.send}`,
      {
        type: method
      },
      token
    );
  }
}

export default MFAManager;
