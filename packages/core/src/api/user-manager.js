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

import "../../types";
import http from "../utils/http";
import constants from "../utils/constants";
import TokenManager from "./token-manager";
import { EV, EVENTS } from "../common";
import { HealthCheck } from "./healthcheck";

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
  activateTrial: "/subscriptions/trial"
};

class UserManager {
  /**
   *
   * @param {import("../database/storage").default} storage
   * @param {import("./index").default} db
   */
  constructor(storage, db) {
    this._storage = storage;
    this._db = db;
    this.tokenManager = new TokenManager(storage);

    EV.subscribe(EVENTS.userUnauthorized, async (url) => {
      if (
        url.includes("/connect/token") ||
        !(await HealthCheck.isAuthServerHealthy())
      )
        return;
      try {
        await this.tokenManager._refreshToken(true);
      } catch (e) {
        if (e.message === "invalid_grant" || e.message === "invalid_client") {
          await this.logout(
            false,
            `Your token has been revoked. Error: ${e.message}.`
          );
        }
      }
    });
  }

  async init() {
    const user = await this.getUser();
    if (!user) return;
  }

  async signup(email, password) {
    email = email.toLowerCase();

    const hashedPassword = await this._storage.hash(password, email);
    await http.post(`${constants.API_HOST}${ENDPOINTS.signup}`, {
      email,
      password: hashedPassword,
      client_id: "notesnook"
    });
    EV.publish(EVENTS.userSignedUp);
    return await this._login({ email, password, hashedPassword });
  }

  async authenticateEmail(email) {
    if (!email) throw new Error("Email is required.");

    email = email.toLowerCase();

    const result = await http.post(`${constants.AUTH_HOST}${ENDPOINTS.token}`, {
      email,
      grant_type: "email",
      client_id: "notesnook"
    });

    await this.tokenManager.saveToken(result);
    return result.additional_data;
  }

  async authenticateMultiFactorCode(code, method) {
    if (!code || !method) throw new Error("code & method are required.");

    const token = await this.tokenManager.getAccessToken();
    if (!token) throw new Error("Unauthorized.");

    await this.tokenManager.saveToken(
      await http.post(
        `${constants.AUTH_HOST}${ENDPOINTS.token}`,
        {
          grant_type: "mfa",
          client_id: "notesnook",
          "mfa:code": code,
          "mfa:method": method
        },
        token
      )
    );
    return true;
  }

  async authenticatePassword(email, password, hashedPassword = null) {
    if (!email || !password) throw new Error("email & password are required.");

    const token = await this.tokenManager.getAccessToken();
    if (!token) throw new Error("Unauthorized.");

    email = email.toLowerCase();
    if (!hashedPassword) {
      hashedPassword = await this._storage.hash(password, email);
    }

    await this.tokenManager.saveToken(
      await http.post(
        `${constants.AUTH_HOST}${ENDPOINTS.token}`,
        {
          grant_type: "mfa_password",
          client_id: "notesnook",
          scope: "notesnook.sync offline_access IdentityServerApi",
          password: hashedPassword
        },
        token
      )
    );

    const user = await this.fetchUser();
    if (!user) throw new Error("Unauthorized.");

    await this._storage.deriveCryptoKey(`_uk_@${user.email}`, {
      password,
      salt: user.salt
    });

    EV.publish(EVENTS.userLoggedIn, user);
  }

  /**
   * @private
   */
  async _login({ email, password, hashedPassword, code, method }) {
    email = email && email.toLowerCase();

    if (!hashedPassword && password) {
      hashedPassword = await this._storage.hash(password, email);
    }

    await this.tokenManager.saveToken(
      await http.post(`${constants.AUTH_HOST}${ENDPOINTS.token}`, {
        username: email,
        password: hashedPassword,
        grant_type: code ? "mfa" : "password",
        scope: "notesnook.sync offline_access openid IdentityServerApi",
        client_id: "notesnook",
        "mfa:code": code,
        "mfa:method": method
      })
    );

    const user = await this.fetchUser();
    await this._storage.deriveCryptoKey(`_uk_@${user.email}`, {
      password,
      salt: user.salt
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
   * @returns {Promise<User | undefined>}
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
      console.error("Error fetching user", e);
      return await this.getUser();
    }
  }

  changePassword(oldPassword, newPassword) {
    return this._updatePassword("change_password", {
      old_password: oldPassword,
      new_password: newPassword
    });
  }

  resetPassword(newPassword) {
    return this._updatePassword("reset_password", {
      new_password: newPassword
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

  async sendVerificationEmail(newEmail) {
    let token = await this.tokenManager.getAccessToken();
    if (!token) return;
    await http.post(
      `${constants.AUTH_HOST}${ENDPOINTS.verifyUser}`,
      { newEmail },
      token
    );
  }

  async changeEmail(newEmail, password, code) {
    const token = await this.tokenManager.getAccessToken();
    if (!token) return;

    const user = await this.getUser();
    if (!user) return;

    const email = newEmail.toLowerCase();

    await http.patch(
      `${constants.AUTH_HOST}${ENDPOINTS.patchUser}`,
      {
        type: "change_email",
        new_email: newEmail,
        password: await this._storage.hash(password, email),
        verification_code: code
      },
      token
    );

    await this._storage.deriveCryptoKey(`_uk_@${newEmail}`, {
      password,
      salt: user.salt
    });
  }

  recoverAccount(email) {
    return http.post(`${constants.AUTH_HOST}${ENDPOINTS.recoverAccount}`, {
      email,
      client_id: "notesnook"
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
        salt
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
          new_password
        },
        token
      );
    });

    return true;
  }
}

export default UserManager;
