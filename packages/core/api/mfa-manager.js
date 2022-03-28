import http from "../utils/http";
import constants from "../utils/constants";
import TokenManager from "./token-manager";

const ENDPOINTS = {
  setup: "/mfa",
  enable: "/mfa",
  disable: "/mfa",
  recoveryCodes: "/mfa/codes",
  send: "/mfa/send",
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
   * @param {string} phoneNumber
   * @returns
   */
  async sendCode(method, token) {
    if (!token) throw new Error("Token is required to make this request.");

    return await http.post(
      `${constants.AUTH_HOST}${ENDPOINTS.send}`,
      {
        type: method,
      },
      token
    );
  }
}

export default MFAManager;
