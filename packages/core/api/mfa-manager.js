import http from "../utils/http";
import constants from "../utils/constants";
import TokenManager from "./token-manager";

const ENDPOINTS = {
  setup: "/mfa/setup",
  enable: "/mfa/enable",
  disable: "/mfa/disable",
  reset: "/mfa/reset",
  recoveryCodes: "/mfa/codes",
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
        phoneNumber,
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
    const token = await this.tokenManager.getAccessToken();
    if (!token) return;
    return await http.post(
      `${constants.AUTH_HOST}${ENDPOINTS.enable}`,
      { type, code },
      token
    );
  }

  async disable() {
    const token = await this.tokenManager.getAccessToken();
    if (!token) return;
    return await http.post(
      `${constants.AUTH_HOST}${ENDPOINTS.disable}`,
      null,
      token
    );
  }

  async reset() {
    const token = await this.tokenManager.getAccessToken();
    if (!token) return;
    return await http.post(
      `${constants.AUTH_HOST}${ENDPOINTS.reset}`,
      null,
      token
    );
  }

  async codes() {
    const token = await this.tokenManager.getAccessToken();
    if (!token) return;
    return await http.get(
      `${constants.AUTH_HOST}${ENDPOINTS.recoveryCodes}`,
      token
    );
  }
}

export default MFAManager;
