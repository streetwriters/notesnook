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
import { SerializedKeyPair, SerializedKey } from "@notesnook/crypto";
import { logger } from "../logger.js";
import { KEY_VERSION, KeyVersion } from "./sync/types.js";
import {
  KeyId,
  KeyManager,
  KeyTypeFromId,
  UnwrapKeyReturnType
} from "./key-manager.js";

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
  private keyManager: KeyManager;
  constructor(private readonly db: Database) {
    this.tokenManager = new TokenManager(db.kv);
    this.keyManager = new KeyManager(db);

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
    await this.tokenManager.saveToken(
      await http.post(`${constants.API_HOST}${ENDPOINTS.signup}`, {
        email,
        password: hashedPassword,
        client_id: "notesnook"
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

    const masterKey = await this.getMasterKey();
    if (!masterKey) throw new Error("User encryption key not generated.");
    await this.updateUser({
      dataEncryptionKey: await this.keyManager.wrapKey(
        await this.db.crypto().generateRandomKey(),
        masterKey
      )
    });

    this.db.eventManager.publish(EVENTS.userLoggedIn, user);
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
      this.db.eventManager.publish(EVENTS.userLoggedIn, user);
    } catch (e) {
      await this.tokenManager.saveToken(token);
      throw e;
    }
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
      this.keyManager.clearCache();
      await this.db.reset();
      this.db.eventManager.publish(EVENTS.userLoggedOut, reason);
      this.db.eventManager.publish(EVENTS.appRefreshRequested);
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
    const oldUser = await this.getUser();
    try {
      const token = await this.tokenManager.getAccessToken();
      if (!token) return;
      const user = await http.get(
        `${constants.API_HOST}${ENDPOINTS.user}`,
        token
      );
      if (user) {
        await this.setUser(user);
        if (
          oldUser &&
          (oldUser.subscription.plan !== user.subscription.plan ||
            oldUser.subscription.status !== user.subscription.status ||
            oldUser.subscription.provider !== user.subscription.provider)
        ) {
          await this.tokenManager._refreshToken(true);
          this.db.eventManager.publish(
            EVENTS.userSubscriptionUpdated,
            user.subscription
          );
        }
        if (oldUser && !oldUser.isEmailConfirmed && user.isEmailConfirmed)
          this.db.eventManager.publish(EVENTS.userEmailConfirmed);
        this.db.eventManager.publish(EVENTS.userFetched, user);
        return user;
      } else {
        return oldUser;
      }
    } catch (e) {
      logger.error(e, "Error fetching user");
      return oldUser;
    }
  }

  changePassword(oldPassword: string, newPassword: string) {
    return this._updatePassword("change", {
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
    return this._updatePassword("reset", {
      new_password: newPassword
    });
  }

  async getDataEncryptionKeys(): Promise<
    { version: KeyVersion; key: SerializedKey }[] | undefined
  > {
    const masterKey = await this.getMasterKey();
    if (!masterKey) return;

    const dataEncryptionKey = await this.keyManager.get("dataEncryptionKey");
    if (!dataEncryptionKey)
      return [
        {
          key: masterKey,
          version: KEY_VERSION.LEGACY
        }
      ];
    const keys: { version: KeyVersion; key: SerializedKey }[] = [];

    const legacyDataEncryptionKey = await this.keyManager.get(
      "legacyDataEncryptionKey"
    );
    if (legacyDataEncryptionKey)
      keys.push({
        key: await this.keyManager.unwrapKey(
          legacyDataEncryptionKey,
          masterKey
        ),
        version: KEY_VERSION.LEGACY
      });
    keys.push({
      key: await this.keyManager.unwrapKey(dataEncryptionKey, masterKey),
      version: KEY_VERSION.DEK
    });
    return keys;
  }

  async getMasterKey(): Promise<SerializedKey | undefined> {
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

  private async getUserKey<TId extends KeyId>(
    id: TId,
    config: {
      generateKey: () => Promise<SerializedKey | SerializedKeyPair>;
      errorContext: string;
    }
  ): Promise<UnwrapKeyReturnType<KeyTypeFromId<TId>> | undefined> {
    try {
      const masterKey = await this.getMasterKey();
      if (!masterKey) return;

      const wrappedKey = await this.keyManager.get(id);

      if (!wrappedKey) {
        const key = await config.generateKey();
        await this.updateUser({
          [id]: await this.keyManager.wrapKey(key, masterKey)
        });
        return key as UnwrapKeyReturnType<KeyTypeFromId<TId>>;
      }

      return (await this.keyManager.unwrapKey(
        wrappedKey,
        masterKey
      )) as UnwrapKeyReturnType<KeyTypeFromId<TId>>;
    } catch (e) {
      logger.error(e, `Could not get ${config.errorContext}.`);
      if (e instanceof Error)
        throw new Error(
          `Could not get ${config.errorContext}. Error: ${e.message}`
        );
    }
  }

  async getAttachmentsKey() {
    return this.getUserKey("attachmentsKey", {
      generateKey: () => this.db.crypto().generateRandomKey(),
      errorContext: "attachments encryption key"
    });
  }

  async getMonographPasswordsKey() {
    return this.getUserKey("monographPasswordsKey", {
      generateKey: () => this.db.crypto().generateRandomKey(),
      errorContext: "monographs encryption key"
    });
  }

  async getInboxKeys() {
    return this.getUserKey("inboxKeys", {
      generateKey: () => this.db.crypto().generateCryptoKeyPair(),
      errorContext: "inbox encryption keys"
    });
  }

  async hasInboxKeys() {
    const user = await this.getUser();
    if (!user) return false;

    return !!user.inboxKeys;
  }

  async discardInboxKeys() {
    this.keyManager.clearCache();

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
      const key = await this.getMasterKey();
      if (!user || !key) return false;

      const cipher = await this.db.storage().encrypt(key, "notesnook");
      const plainText = await this.db.storage().decrypt({ password }, cipher);
      return plainText === "notesnook";
    } catch (e) {
      logger.error(e);
      return false;
    }
  }

  async _updatePassword(
    type: "change" | "reset",
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

    const { new_password, old_password } = data;
    if (old_password && !(await this.verifyPassword(old_password)))
      throw new Error("Incorrect old password.");

    const oldPassword = old_password
      ? await this.db.storage().hash(old_password, email, {
          usesFallback: await this.usesFallbackPWHash(old_password)
        })
      : null;

    if (!new_password) throw new Error("New password is required.");

    data.encryptionKey = data.encryptionKey || (await this.getMasterKey());

    const updateUserPayload: Partial<User> = {};
    console.log(
      "Has encryption key",
      !!data.encryptionKey,
      await this.getMasterKey()
    );
    if (data.encryptionKey) {
      const newMasterKey = await this.db
        .storage()
        .generateCryptoKey(new_password, salt);
      if (user.attachmentsKey) {
        updateUserPayload.attachmentsKey = await this.keyManager.rewrapKey(
          user.attachmentsKey,
          data.encryptionKey,
          newMasterKey
        );
      }
      if (user.monographPasswordsKey) {
        updateUserPayload.monographPasswordsKey =
          await this.keyManager.rewrapKey(
            user.monographPasswordsKey,
            data.encryptionKey,
            newMasterKey
          );
      }
      if (user.inboxKeys) {
        updateUserPayload.inboxKeys = await this.keyManager.rewrapKey(
          user.inboxKeys,
          data.encryptionKey,
          newMasterKey
        );
      }

      if (user.legacyDataEncryptionKey)
        updateUserPayload.legacyDataEncryptionKey =
          await this.keyManager.rewrapKey(
            user.legacyDataEncryptionKey,
            data.encryptionKey,
            newMasterKey
          );
      if (user.dataEncryptionKey)
        updateUserPayload.dataEncryptionKey = await this.keyManager.rewrapKey(
          user.dataEncryptionKey,
          data.encryptionKey,
          newMasterKey
        );
      else {
        updateUserPayload.dataEncryptionKey = await this.keyManager.wrapKey(
          await this.db.crypto().generateRandomKey(),
          newMasterKey
        );
        updateUserPayload.legacyDataEncryptionKey =
          await this.keyManager.wrapKey(data.encryptionKey, newMasterKey);
      }
    }

    await http.patch.json(
      `${constants.API_HOST}/users/password/${type}`,
      {
        oldPassword: oldPassword,
        newPassword: await this.db.storage().hash(new_password, email),
        userKeys: updateUserPayload
      },
      token
    );

    await this.db.storage().deriveCryptoKey({
      password: new_password,
      salt
    });

    this.keyManager.clearCache();
    await this.setUser({ ...user, ...updateUserPayload });

    return true;
  }

  private async usesFallbackPWHash(password: string) {
    const user = await this.getUser();
    const encryptionKey = await this.getMasterKey();
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
