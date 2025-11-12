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

import { User } from "../types.js";
import http from "../utils/http.js";
import constants from "../utils/constants.js";
import TokenManager from "./token-manager.js";
import { EV, EVENTS } from "../common.js";
import { HealthCheck } from "./healthcheck.js";
import Database from "./index.js";
import { SerializedKeyPair, SerializedKey, Cipher } from "@notesnook/crypto";
import { logger } from "../logger.js";

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
  private tokenManager: TokenManager;
  private cachedAttachmentKey?: SerializedKey;
  private cachedMonographPasswordsKey?: SerializedKey;
  private cachedInboxKeys?: SerializedKeyPair;
  constructor(private readonly db: Database) {
    this.tokenManager = new TokenManager(this.db.kv);

    EV.subscribe(EVENTS.userUnauthorized, async (url: string) => {
      if (url.includes("/connect/token") || !(await HealthCheck.auth())) return;
      try {
        await this.tokenManager._refreshToken(true);
      } catch (e) {
        if (
          e instanceof Error &&
          (e.message === "invalid_grant" || e.message === "invalid_client")
        ) {
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

  async signup(email: string, password: string) {
    email = email.toLowerCase();

    const hashedPassword = await this.db.storage().hash(password, email);
    await http.post(`${constants.API_HOST}${ENDPOINTS.signup}`, {
      email,
      password: hashedPassword,
      client_id: "notesnook"
    });
    EV.publish(EVENTS.userSignedUp);
    return await this._login({ email, password, hashedPassword });
  }

  async authenticateEmail(email: string) {
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

  async authenticateMultiFactorCode(code: string, method: string) {
    if (!code || !method) throw new Error("code & method are required.");

    const token = await this.tokenManager.getToken();
    if (!token || token.scope !== "auth:grant_types:mfa")
      throw new Error("No token found.");

    await this.tokenManager.saveToken(
      await http.post(
        `${constants.AUTH_HOST}${ENDPOINTS.token}`,
        {
          grant_type: "mfa",
          client_id: "notesnook",
          "mfa:code": code,
          "mfa:method": method
        },
        token.access_token
      )
    );
    return true;
  }

  async authenticatePassword(
    email: string,
    password: string,
    hashedPassword?: string,
    sessionExpired?: boolean
  ) {
    if (!email || !password) throw new Error("email & password are required.");

    const token = await this.tokenManager.getToken();
    if (!token || token.scope !== "auth:grant_types:mfa_password")
      throw new Error("No token found.");

    email = email.toLowerCase();
    if (!hashedPassword) {
      hashedPassword = await this.db.storage().hash(password, email);
    }
    try {
      let usesFallback = false;
      await this.tokenManager.saveToken(
        await http
          .post(
            `${constants.AUTH_HOST}${ENDPOINTS.token}`,
            {
              grant_type: "mfa_password",
              client_id: "notesnook",
              scope: "notesnook.sync offline_access IdentityServerApi",
              password: hashedPassword
            },
            token.access_token
          )
          .catch(async (e) => {
            if (e instanceof Error && e.message === "Password is incorrect.") {
              hashedPassword = await this.db
                .storage()
                .hash(password, email, { usesFallback: true });
              if (hashedPassword === null) return Promise.reject(e);
              usesFallback = true;
              return await http.post(
                `${constants.AUTH_HOST}${ENDPOINTS.token}`,
                {
                  grant_type: "mfa_password",
                  client_id: "notesnook",
                  scope: "notesnook.sync offline_access IdentityServerApi",
                  password: hashedPassword
                },
                token.access_token
              );
            }
            return Promise.reject(e);
          })
      );

      const user = await this.fetchUser();
      if (!user) throw new Error("Failed to fetch user.");

      if (!sessionExpired) {
        await this.db.setLastSynced(0);
        await this.db.syncer.devices.register();
      }

      if (usesFallback) {
        await this.db.storage().deriveCryptoKeyFallback({
          password,
          salt: user.salt
        });
      } else {
        await this.db.storage().deriveCryptoKey({
          password,
          salt: user.salt
        });
      }
      EV.publish(EVENTS.userLoggedIn, user);
    } catch (e) {
      await this.tokenManager.saveToken(token);
      throw e;
    }
  }

  async _login({
    email,
    password,
    hashedPassword,
    code,
    method
  }: {
    email: string;
    password: string;
    hashedPassword?: string;
    code?: string;
    method?: string;
  }) {
    email = email && email.toLowerCase();

    if (!hashedPassword && password) {
      hashedPassword = await this.db.storage().hash(password, email);
    }

    await this.tokenManager.saveToken(
      await http.post(`${constants.AUTH_HOST}${ENDPOINTS.token}`, {
        username: email,
        password: hashedPassword,
        grant_type: code ? "mfa" : "password",
        scope: "notesnook.sync offline_access IdentityServerApi",
        client_id: "notesnook",
        "mfa:code": code,
        "mfa:method": method
      })
    );

    const user = await this.fetchUser();
    if (!user) return;

    await this.db.storage().deriveCryptoKey({
      password,
      salt: user.salt
    });
    await this.db.setLastSynced(0);
    await this.db.syncer.devices.register();

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

  async logout(revoke = true, reason?: string) {
    try {
      await this.db.syncer.devices.unregister();
      if (revoke) await this.tokenManager.revokeToken();
    } catch (e) {
      logger.error(e, "Error logging out user.", { revoke, reason });
    } finally {
      this.cachedAttachmentKey = undefined;
      this.cachedInboxKeys = undefined;
      await this.db.reset();
      EV.publish(EVENTS.userLoggedOut, reason);
      EV.publish(EVENTS.appRefreshRequested);
    }
  }

  setUser(user: User) {
    return this.db.kv().write("user", user);
  }

  getUser() {
    return this.db.kv().read("user");
  }

  /**
   * @deprecated
   */
  getLegacyUser() {
    return this.db.storage().read<User>("user");
  }

  async resetUser(removeAttachments = true) {
    const token = await this.tokenManager.getAccessToken();
    if (!token) return;
    await http.post(
      `${constants.API_HOST}${ENDPOINTS.resetUser}`,
      { removeAttachments },
      token
    );
    return true;
  }

  private async updateUser(partial: Partial<User>) {
    const user = await this.getUser();
    if (!user) return;

    const token = await this.tokenManager.getAccessToken();
    await http.patch.json(
      `${constants.API_HOST}${ENDPOINTS.user}`,
      partial,
      token
    );

    await this.setUser({ ...user, ...partial });
  }

  async deleteUser(password: string) {
    const token = await this.tokenManager.getAccessToken();
    const user = await this.getUser();
    if (!token || !user) return;

    await http.post(
      `${constants.API_HOST}${ENDPOINTS.deleteUser}`,
      {
        password: await this.db.storage().hash(password, user.email, {
          usesFallback: await this.usesFallbackPWHash(password)
        })
      },
      token
    );
    await this.logout(false, "Account deleted.");
    return true;
  }

  async fetchUser(): Promise<User | undefined> {
    try {
      const token = await this.tokenManager.getAccessToken();
      if (!token) return;
      const user = await http.get(
        `${constants.API_HOST}${ENDPOINTS.user}`,
        token
      );
      if (user) {
        const oldUser = await this.getUser();
        await this.setUser(user);
        if (
          oldUser &&
          (oldUser.subscription.plan !== user.subscription.plan ||
            oldUser.subscription.status !== user.subscription.status ||
            oldUser.subscription.provider !== user.subscription.provider)
        ) {
          await this.tokenManager._refreshToken(true);
          EV.publish(EVENTS.userSubscriptionUpdated, user.subscription);
        }
        if (oldUser && !oldUser.isEmailConfirmed && user.isEmailConfirmed)
          EV.publish(EVENTS.userEmailConfirmed);
        EV.publish(EVENTS.userFetched, user);
        return user;
      } else {
        return await this.getUser();
      }
    } catch (e) {
      logger.error(e, "Error fetching user");
      return await this.getUser();
    }
  }

  changePassword(oldPassword: string, newPassword: string) {
    return this._updatePassword("change_password", {
      old_password: oldPassword,
      new_password: newPassword
    });
  }

  async changeMarketingConsent(enabled: boolean) {
    const token = await this.tokenManager.getAccessToken();
    if (!token) return;

    await http.patch(
      `${constants.AUTH_HOST}${ENDPOINTS.patchUser}`,
      {
        type: "change_marketing_consent",
        enabled: enabled
      },
      token
    );
  }

  resetPassword(newPassword: string) {
    return this._updatePassword("reset_password", {
      new_password: newPassword
    });
  }

  async getEncryptionKey(): Promise<SerializedKey | undefined> {
    const user = await this.getUser();
    if (!user) return;
    const key = await this.db.storage().getCryptoKey();
    if (!key) return;
    return { key, salt: user.salt };
  }

  /**
   * @deprecated
   */
  async getLegacyEncryptionKey(): Promise<SerializedKey | undefined> {
    const user = await this.getLegacyUser();
    if (!user) return;
    const key = await this.db.storage().getCryptoKey();
    if (!key) return;
    return { key, salt: user.salt };
  }

  private async getUserKey<T>(config: {
    getCache: () => T | undefined;
    setCache: (key: T) => void;
    userProperty: keyof User;
    generateKey: () => Promise<T>;
    errorContext: string;
    decrypt: (user: User, userEncryptionKey: SerializedKey) => Promise<T>;
    encrypt: (
      key: T,
      userEncryptionKey: SerializedKey
    ) => Promise<Partial<User>>;
  }): Promise<T | undefined> {
    const cachedKey = config.getCache();
    if (cachedKey) return cachedKey;

    try {
      let user = await this.getUser();
      if (!user) return;

      if (!user[config.userProperty]) {
        const token = await this.tokenManager.getAccessToken();
        user = await http.get(`${constants.API_HOST}${ENDPOINTS.user}`, token);
      }
      if (!user) return;

      const userEncryptionKey = await this.getEncryptionKey();
      if (!userEncryptionKey) return;

      if (!user[config.userProperty]) {
        const key = await config.generateKey();
        const updatePayload = await config.encrypt(key, userEncryptionKey);
        await this.updateUser(updatePayload);
        return key;
      }

      const decryptedKey = await config.decrypt(user, userEncryptionKey);
      config.setCache(decryptedKey);
      return decryptedKey;
    } catch (e) {
      logger.error(e, `Could not get ${config.errorContext}.`);
      if (e instanceof Error)
        throw new Error(
          `Could not get ${config.errorContext}. Error: ${e.message}`
        );
    }
  }

  async getAttachmentsKey() {
    return this.getUserKey<SerializedKey>({
      getCache: () => this.cachedAttachmentKey,
      setCache: (key) => {
        this.cachedAttachmentKey = key;
      },
      userProperty: "attachmentsKey",
      generateKey: () => this.db.crypto().generateRandomKey(),
      errorContext: "attachments encryption key",
      encrypt: async (key, userEncryptionKey) => {
        const encryptedKey = await this.db
          .storage()
          .encrypt(userEncryptionKey, JSON.stringify(key));
        return { attachmentsKey: encryptedKey };
      },
      decrypt: async (user, userEncryptionKey) => {
        const encryptedKey = user.attachmentsKey as Cipher<"base64">;
        const plainData = await this.db
          .storage()
          .decrypt(userEncryptionKey, encryptedKey);
        if (!plainData) throw new Error("Failed to decrypt attachments key");
        return JSON.parse(plainData) as SerializedKey;
      }
    });
  }

  async getMonographPasswordsKey() {
    return this.getUserKey<SerializedKey>({
      getCache: () => this.cachedMonographPasswordsKey,
      setCache: (key) => {
        this.cachedMonographPasswordsKey = key;
      },
      userProperty: "monographPasswordsKey",
      generateKey: () => this.db.crypto().generateRandomKey(),
      errorContext: "monographs encryption key",
      encrypt: async (key, userEncryptionKey) => {
        const encryptedKey = await this.db
          .storage()
          .encrypt(userEncryptionKey, JSON.stringify(key));
        return { monographPasswordsKey: encryptedKey };
      },
      decrypt: async (user, userEncryptionKey) => {
        const encryptedKey = user.monographPasswordsKey as Cipher<"base64">;
        const plainData = await this.db
          .storage()
          .decrypt(userEncryptionKey, encryptedKey);
        if (!plainData)
          throw new Error("Failed to decrypt monograph passwords key");
        return JSON.parse(plainData) as SerializedKey;
      }
    });
  }

  async getInboxKeys() {
    return this.getUserKey<SerializedKeyPair>({
      getCache: () => this.cachedInboxKeys,
      setCache: (key) => {
        this.cachedInboxKeys = key;
      },
      userProperty: "inboxKeys",
      generateKey: () => this.db.crypto().generateCryptoKeyPair(),
      errorContext: "inbox encryption keys",
      encrypt: async (keys, userEncryptionKey) => {
        const encryptedPrivateKey = await this.db
          .storage()
          .encrypt(userEncryptionKey, JSON.stringify(keys.privateKey));
        return {
          inboxKeys: {
            public: keys.publicKey,
            private: encryptedPrivateKey
          }
        };
      },
      decrypt: async (user, userEncryptionKey) => {
        if (!user.inboxKeys) throw new Error("Inbox keys not found");
        const decryptedPrivateKey = await this.db
          .storage()
          .decrypt(userEncryptionKey, user.inboxKeys.private);
        return {
          publicKey: user.inboxKeys.public,
          privateKey: JSON.parse(decryptedPrivateKey)
        };
      }
    });
  }

  async hasInboxKeys() {
    if (this.cachedInboxKeys) return true;

    let user = await this.getUser();
    if (!user) return false;

    return !!user.inboxKeys;
  }

  async discardInboxKeys() {
    this.cachedInboxKeys = undefined;

    const user = await this.getUser();
    if (!user) return;

    const token = await this.tokenManager.getAccessToken();
    await http.patch.json(
      `${constants.API_HOST}${ENDPOINTS.user}`,
      { inboxKeys: { public: null, private: null } },
      token
    );

    await this.setUser({ ...user, inboxKeys: undefined });
  }

  async sendVerificationEmail(newEmail?: string) {
    const token = await this.tokenManager.getAccessToken();
    if (!token) return;
    await http.post(
      `${constants.AUTH_HOST}${ENDPOINTS.verifyUser}`,
      { newEmail },
      token
    );
  }

  async changeEmail(newEmail: string, password: string, code: string) {
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
        password: await this.db.storage().hash(password, email, {
          usesFallback: await this.usesFallbackPWHash(password)
        }),
        verification_code: code
      },
      token
    );
  }

  recoverAccount(email: string) {
    return http.post(`${constants.AUTH_HOST}${ENDPOINTS.recoverAccount}`, {
      email,
      client_id: "notesnook"
    });
  }

  async verifyPassword(password: string) {
    try {
      const user = await this.getUser();
      const key = await this.getEncryptionKey();
      if (!user || !key) return false;

      const cipher = await this.db.storage().encrypt(key, "notesnook");
      const plainText = await this.db.storage().decrypt({ password }, cipher);
      return plainText === "notesnook";
    } catch (e) {
      return false;
    }
  }

  async _updatePassword(
    type: "change_password" | "reset_password",
    data: {
      new_password: string;
      old_password?: string;
      encryptionKey?: SerializedKey;
    }
  ) {
    const token = await this.tokenManager.getAccessToken();
    const user = await this.getUser();
    if (!token || !user) throw new Error("You are not logged in.");

    const { email, salt } = user;

    let { new_password, old_password } = data;
    if (old_password && !(await this.verifyPassword(old_password)))
      throw new Error("Incorrect old password.");

    if (!new_password) throw new Error("New password is required.");

    data.encryptionKey = data.encryptionKey || (await this.getEncryptionKey());

    await this.clearSessions();

    if (data.encryptionKey) await this.db.sync({ type: "fetch", force: true });

    if (old_password)
      old_password = await this.db.storage().hash(old_password, email, {
        usesFallback: await this.usesFallbackPWHash(old_password)
      });

    // retrieve user keys before deriving a new encryption key
    const oldUserKeys = {
      attachmentsKey: await this.getAttachmentsKey(),
      monographPasswordsKey: await this.getMonographPasswordsKey(),
      inboxKeys: (await this.hasInboxKeys())
        ? await this.getInboxKeys()
        : undefined
    } as const;

    await this.db.storage().deriveCryptoKey({
      password: new_password,
      salt
    });

    if (!(await this.resetUser(false))) return;

    await this.db.sync({ type: "send", force: true });

    const userEncryptionKey = await this.getEncryptionKey();
    if (userEncryptionKey) {
      const updateUserPayload: Partial<User> = {};
      if (oldUserKeys.attachmentsKey) {
        user.attachmentsKey = await this.db
          .storage()
          .encrypt(
            userEncryptionKey,
            JSON.stringify(oldUserKeys.attachmentsKey)
          );
        updateUserPayload.attachmentsKey = user.attachmentsKey;
      }
      if (oldUserKeys.monographPasswordsKey) {
        user.monographPasswordsKey = await this.db
          .storage()
          .encrypt(
            userEncryptionKey,
            JSON.stringify(oldUserKeys.monographPasswordsKey)
          );
        updateUserPayload.monographPasswordsKey = user.monographPasswordsKey;
      }
      if (oldUserKeys.inboxKeys) {
        user.inboxKeys = {
          public: oldUserKeys.inboxKeys.publicKey,
          private: await this.db
            .storage()
            .encrypt(
              userEncryptionKey,
              JSON.stringify(oldUserKeys.inboxKeys.privateKey)
            )
        };
        updateUserPayload.inboxKeys = user.inboxKeys;
      }
      if (Object.keys(updateUserPayload).length > 0) {
        await this.updateUser(updateUserPayload);
      }
    }

    if (new_password)
      new_password = await this.db.storage().hash(new_password, email);

    await http.patch(
      `${constants.AUTH_HOST}${ENDPOINTS.patchUser}`,
      {
        type,
        old_password,
        new_password
      },
      token
    );

    return true;
  }

  private async usesFallbackPWHash(password: string) {
    const user = await this.getUser();
    const encryptionKey = await this.getEncryptionKey();
    if (!user || !encryptionKey) return false;
    const fallbackCryptoKey = await this.db
      .storage()
      .generateCryptoKeyFallback(password, user.salt);
    if (!fallbackCryptoKey) return false;
    const cryptoKey = await this.db
      .storage()
      .generateCryptoKey(password, user.salt);

    if (!encryptionKey.key || !fallbackCryptoKey.key || !cryptoKey.key)
      throw new Error("Failed to generate crypto keys.");

    if (
      fallbackCryptoKey.key !== encryptionKey.key &&
      cryptoKey.key !== encryptionKey.key
    )
      throw new Error("Wrong password.");

    return fallbackCryptoKey.key === encryptionKey.key;
  }
}

export default UserManager;
