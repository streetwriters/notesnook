import http from "../utils/http";
import constants from "../utils/constants";
import TokenManager from "./token-manager";
import { EV } from "../common";

const ENDPOINTS = {
  signup: "/users",
  token: "/connect/token",
  user: "/users",
  deleteUser: "/users/delete",
  patchUser: "/account",
  verifyUser: "/account/verify",
  revoke: "/connect/revocation",
  recoverAccount: "/account/recover",
};

class UserManager {
  /**
   *
   * @param {import("./index").default} db
   */
  constructor(db) {
    this._db = db;
    this.tokenManager = new TokenManager(db);
  }

  async signup(email, password) {
    await http.post(`${constants.API_HOST}${ENDPOINTS.signup}`, {
      email,
      password,
      client_id: "notesnook",
    });
    return await this.login(email, password);
  }

  async login(email, password, remember) {
    await this.tokenManager.saveToken(
      await http.post(`${constants.AUTH_HOST}${ENDPOINTS.token}`, {
        username: email,
        password,
        grant_type: "password",
        scope: "notesnook.sync offline_access openid IdentityServerApi",
        client_id: "notesnook",
      })
    );

    const user = await this.fetchUser(remember);
    await this._db.context.deriveCryptoKey(`_uk_@${user.email}`, {
      password,
      salt: user.salt,
    });

    EV.publish("user:loggedIn", user);
  }

  async getSessions() {
    const token = await this.tokenManager.getAccessToken();
    if (!token) return;
    await http.get(`${constants.AUTH_HOST}/account/sessions`, token);
  }

  async logout(revoke = true, reason) {
    if (revoke) await this.tokenManager.revokeToken();
    await this._db.context.clear();

    EV.publish("user:loggedOut", reason);
  }

  setUser(user) {
    if (!user) return;
    return this._db.context.write("user", user);
  }

  getUser() {
    return this._db.context.read("user");
  }

  async deleteUser(password) {
    let token = await this.tokenManager.getAccessToken();
    if (!token) return;
    await http.post(
      `${constants.API_HOST}${ENDPOINTS.deleteUser}`,
      { password },
      token
    );
    await this.logout(false, "Account deleted.");
    return true;
  }

  async fetchUser(remember) {
    try {
      let token = await this.tokenManager.getAccessToken();
      if (!token) return;
      const user = await http.get(
        `${constants.API_HOST}${ENDPOINTS.user}`,
        token
      );
      if (user) {
        await this.setUser({ ...user, remember });
        EV.publish("user:fetched", user);
        return user;
      }
    } catch (e) {
      if (e.message === "invalid_grant") {
        await this.logout(
          false,
          "You were logged out. Either your session expired or your account was deleted. Please try logging in again."
        );
      } else {
        return await this.getUser();
      }
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
    const key = await this._db.context.getCryptoKey(`_uk_@${user.email}`);
    return { key, salt: user.salt };
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

  async _updatePassword(type, data) {
    let token = await this.tokenManager.getAccessToken();
    if (!token) return;
    await http.patch(
      `${constants.AUTH_HOST}${ENDPOINTS.patchUser}`,
      {
        type,
        ...data,
      },
      token
    );
    await this._db.outbox.add(
      type,
      { newPassword: data.new_password },
      async () => {
        const key = await this.getEncryptionKey();
        const { email } = await this.getUser();
        await this._db.context.deriveCryptoKey(`_uk_@${email}`, {
          password: data.new_password,
          salt: key.salt,
        });
        await this._db.sync(false, true);
      }
    );
    return true;
  }
}

export default UserManager;
