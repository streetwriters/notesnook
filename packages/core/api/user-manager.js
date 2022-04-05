import "../types";
import http from "../utils/http";
import constants from "../utils/constants";
import TokenManager from "./token-manager";
import { EV, EVENTS, setUserPersonalizationBytes } from "../common";

const ENDPOINTS = {
  signup: "/users",
  token: "/connect/token",
  user: "/users",
  deleteUser: "/users/delete",
  patchUser: "/account",
  verifyUser: "/account/verify",
  revoke: "/connect/revocation",
  recoverAccount: "/account/recover",
  resetUser: "/users/reset",
  activateTrial: "/subscriptions/trial",
};

class UserManager {
  /**
   *
   * @param {import("../database/storage").default} storage
   * @param {import("../api/index").default} db
   */
  constructor(storage, db) {
    this._storage = storage;
    this._db = db;
    this.tokenManager = new TokenManager(storage);

    EV.subscribe(EVENTS.userUnauthorized, async (url) => {
      if (url.includes("/connect/token")) return;
      try {
        await this.tokenManager._refreshToken(true);
      } catch (e) {
        await this.logout(
          false,
          `Your token has been revoked. Error: ${e.message}.`
        );
      }
    });
  }

  async init() {
    const user = await this.getUser();
    if (!user) return;
    setUserPersonalizationBytes(user.salt);
  }

  async signup(email, password) {
    const hashedPassword = await this._storage.hash(password, email);
    await http.post(`${constants.API_HOST}${ENDPOINTS.signup}`, {
      email,
      password: hashedPassword,
      client_id: "notesnook",
    });
    EV.publish(EVENTS.userSignedUp);
    return await this._login({ email, password, hashedPassword });
  }

  async login(email, password) {
    return this._login({ email, password });
  }

  async mfaLogin(email, password, { code, method }) {
    return this._login({ email, password, code, method });
  }

  /**
   * @private
   */
  async _login({ email, password, hashedPassword, code, method }) {
    if (!hashedPassword) {
      hashedPassword = await this._storage.hash(password, email);
    }

    await this.tokenManager.saveToken(
      await http.post(`${constants.AUTH_HOST}${ENDPOINTS.token}`, {
        username: email,
        password: hashedPassword,
        grant_type: "password",
        scope: "notesnook.sync offline_access openid IdentityServerApi",
        client_id: "notesnook",
        "mfa:code": code,
        "mfa:method": method,
      })
    );

    const user = await this.fetchUser();
    setUserPersonalizationBytes(user.salt);
    await this._storage.deriveCryptoKey(`_uk_@${user.email}`, {
      password,
      salt: user.salt,
    });

    EV.publish(EVENTS.userLoggedIn, user);
  }

  async getSessions() {
    const token = await this.tokenManager.getAccessToken();
    if (!token) return;
    await http.get(`${constants.AUTH_HOST}/account/sessions`, token);
  }

  async clearSessions(all = false) {
    const token = await this.tokenManager.getToken();
    if (!token) return;
    const { access_token, refresh_token } = token;
    await http.post(
      `${constants.AUTH_HOST}/account/sessions/clear?all=${all}`,
      { refresh_token },
      access_token
    );
  }

  async activateTrial() {
    const token = await this.tokenManager.getAccessToken();
    if (!token) return false;
    await http.post(
      `${constants.SUBSCRIPTIONS_HOST}${ENDPOINTS.activateTrial}`,
      null,
      token
    );
    return true;
  }

  async logout(revoke = true, reason) {
    try {
      if (revoke) await this.tokenManager.revokeToken();
    } catch (e) {
      console.error(e);
    } finally {
      await this._storage.clear();
      EV.publish(EVENTS.userLoggedOut, reason);
      EV.publish(EVENTS.appRefreshRequested);
    }
  }

  setUser(user) {
    if (!user) return;
    return this._storage.write("user", user);
  }

  /**
   *
   * @returns {Promise<User>}
   */
  getUser() {
    return this._storage.read("user");
  }

  async resetUser(removeAttachments = true) {
    let token = await this.tokenManager.getAccessToken();
    if (!token) return;
    await http.post(
      `${constants.API_HOST}${ENDPOINTS.resetUser}`,
      { removeAttachments },
      token
    );
    return true;
  }

  async updateUser(user) {
    if (!user) return;

    let token = await this.tokenManager.getAccessToken();
    await http.patch.json(
      `${constants.API_HOST}${ENDPOINTS.user}`,
      user,
      token
    );

    await this.setUser(user);
  }

  async deleteUser(password) {
    let token = await this.tokenManager.getAccessToken();
    if (!token) return;
    const user = await this.getUser();
    await http.post(
      `${constants.API_HOST}${ENDPOINTS.deleteUser}`,
      { password: await this._storage.hash(password, user.email) },
      token
    );
    await this.logout(false, "Account deleted.");
    return true;
  }

  /**
   *
   * @returns {Promise<User>}
   */
  async fetchUser() {
    try {
      let token = await this.tokenManager.getAccessToken();
      if (!token) return;
      const user = await http.get(
        `${constants.API_HOST}${ENDPOINTS.user}`,
        token
      );
      if (user) {
        await this.setUser(user);
        EV.publish(EVENTS.userFetched, user);
        return user;
      } else {
        return await this.getUser();
      }
    } catch (e) {
      console.error(e);
      return await this.getUser();
    }
  }

  changePassword(oldPassword, newPassword) {
    return this._updatePassword("change_password", {
      old_password: oldPassword,
      new_password: newPassword,
    });
  }

  resetPassword(newPassword) {
    return this._updatePassword("reset_password", {
      new_password: newPassword,
    });
  }

  async getEncryptionKey() {
    const user = await this.getUser();
    if (!user) return;
    const key = await this._storage.getCryptoKey(`_uk_@${user.email}`);
    if (!key) return;
    return { key, salt: user.salt };
  }

  async getAttachmentsKey() {
    try {
      let user = await this.getUser();
      if (!user) return;

      if (!user.attachmentsKey) {
        let token = await this.tokenManager.getAccessToken();
        user = await http.get(`${constants.API_HOST}${ENDPOINTS.user}`, token);
      }

      const userEncryptionKey = await this.getEncryptionKey();
      if (!userEncryptionKey) return;

      if (!user.attachmentsKey) {
        const key = await this._storage.generateRandomKey();
        user.attachmentsKey = await this._storage.encrypt(
          userEncryptionKey,
          JSON.stringify(key)
        );

        await this.updateUser(user);
        return key;
      }

      const plainData = await this._storage.decrypt(
        userEncryptionKey,
        user.attachmentsKey
      );
      return JSON.parse(plainData);
    } catch (e) {
      console.error(e);
      throw new Error(
        `Could not get attachments encryption key. Please make sure you have Internet access. Error: ${e.message}`
      );
    }
  }

  async sendVerificationEmail() {
    let token = await this.tokenManager.getAccessToken();
    if (!token) return;
    await http.post(
      `${constants.AUTH_HOST}${ENDPOINTS.verifyUser}`,
      null,
      token
    );
  }

  recoverAccount(email) {
    return http.post(`${constants.AUTH_HOST}${ENDPOINTS.recoverAccount}`, {
      email,
      client_id: "notesnook",
    });
  }

  async verifyPassword(password) {
    try {
      const user = await this.getUser();
      if (!user) return false;
      const key = await this.getEncryptionKey();
      const cipher = await this._storage.encrypt(key, "notesnook");
      const plainText = await this._storage.decrypt({ password }, cipher);
      return plainText === "notesnook";
    } catch (e) {
      return false;
    }
  }

  async _updatePassword(type, data) {
    const token = await this.tokenManager.getAccessToken();
    const user = await this.getUser();
    if (!token || !user) throw new Error("You are not logged in.");

    const { email, salt } = user;

    let { new_password, old_password } = data;
    if (old_password && !(await this.verifyPassword(old_password)))
      throw new Error("Incorrect old password.");

    if (!new_password) throw new Error("New password is required.");

    const attachmentsKey = await this.getAttachmentsKey();
    data.encryptionKey = data.encryptionKey || (await this.getEncryptionKey());
    await this._db.outbox.add(type, data, async () => {
      if (data.encryptionKey) await this._db.sync(true, true);

      await this._storage.deriveCryptoKey(`_uk_@${email}`, {
        password: new_password,
        salt,
      });

      if (!(await this.resetUser(false))) return;

      if (attachmentsKey) {
        const userEncryptionKey = await this.getEncryptionKey();
        if (!userEncryptionKey) return;
        user.attachmentsKey = await this._storage.encrypt(
          userEncryptionKey,
          JSON.stringify(attachmentsKey)
        );
        await this.updateUser(user);
      }

      await this._db.sync(false, true);

      if (old_password)
        old_password = await this._storage.hash(old_password, email);
      if (new_password)
        new_password = await this._storage.hash(new_password, email);

      await http.patch(
        `${constants.AUTH_HOST}${ENDPOINTS.patchUser}`,
        {
          type,
          old_password,
          new_password,
        },
        token
      );
    });

    return true;
  }
}

export default UserManager;
