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

import { User, UserKeys } from "../types.js";
import http, { RequestError } from "../utils/http.js";
import constants from "../utils/constants.js";
import TokenManager from "./token-manager.js";
import { EV, EVENTS } from "../common.js";
import { HealthCheck } from "./healthcheck.js";
import Database from "./index.js";
import { SerializedKeyPair, SerializedKey, Cipher } from "@notesnook/crypto";
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
  userKeys: "/users/keys",
  commitPendingKeys: "/users/keys/pending/commit",
  discardPendingKeys: "/users/keys/pending/discard",
  inboxKeys: "/users/keys/inbox",
  activateTrial: "/subscriptions/trial"
};

const MASTER_KEY_CHANGE_TIMEOUT = 30 * 1000;

function revisionQuery(revision?: number) {
  return revision === undefined ? "" : `?revision=${revision}`;
}

/**
 * Any one of the keys, to check which master key wrapped them.
 */
function anyWrappedKey(keys?: UserKeys) {
  return (
    keys?.dataEncryptionKey ||
    keys?.legacyDataEncryptionKey ||
    keys?.attachmentsKey ||
    keys?.monographPasswordsKey ||
    keys?.inboxKeys?.private
  );
}

class UserManager {
  private tokenManager: TokenManager;
  private keyManager: KeyManager;
  constructor(private readonly db: Database) {
    this.keyManager = new KeyManager(db);
    this.tokenManager = db.tokenManager;

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

    // stored by setMasterKey, so a failed signup stores nothing
    const user = await this.getRemoteUser();
    if (!user) throw new Error("Failed to fetch user after signup.");

    await this.db.setLastSynced(0);
    await this.db.syncer.devices.register();

    // the keys are added before the master key is set so that the master key
    // is never used without a data encryption key
    const masterKey = await this.db
      .storage()
      .generateCryptoKey(password, user.salt);
    const keys: UserKeys = {
      dataEncryptionKey: await this.keyManager.wrapKey(
        await this.db.crypto().generateRandomKey(),
        masterKey
      ),
      attachmentsKey: await this.keyManager.wrapKey(
        await this.db.crypto().generateRandomKey(),
        masterKey
      ),
      monographPasswordsKey: await this.keyManager.wrapKey(
        await this.db.crypto().generateRandomKey(),
        masterKey
      )
    };
    const updatedUser = await this.addUserKeys(keys, user.revision);
    await this.setMasterKey(updatedUser, { password });

    this.db.eventManager.publish(EVENTS.userLoggedIn, updatedUser);
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

      // stored by setMasterKey, so a failed login stores nothing
      const user = await this.getRemoteUser();
      if (!user) throw new Error("Failed to fetch user.");

      if (!sessionExpired) {
        await this.db.setLastSynced(0);
        await this.db.syncer.devices.register();
      }

      await this.setMasterKey(user, { password, usesFallback });
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
    return this.db.kv().writeUser(user);
  }

  getUser() {
    return this.db.kv().read("user");
  }

  /**
   * Stores the user before changing the master key, so the stored keys are
   * never older than the master key: in between, unwrapping them fails
   * instead of data getting encrypted with the wrong key.
   */
  private async setMasterKey(
    user: User,
    credentials: { password: string; usesFallback?: boolean }
  ) {
    // resolved before anything is stored so that a failed commit leaves
    // this device as it was
    const resolvedUser = user.pendingKeys
      ? (await this.resolvePendingKeys(user, credentials)) || user
      : user;

    await this.db.kv().write("masterKeyChangeStartedAt", Date.now());
    try {
      await this.setUser(resolvedUser);
      this.keyManager.clearCache();
      const key = { password: credentials.password, salt: resolvedUser.salt };
      if (credentials.usesFallback)
        await this.db.storage().deriveCryptoKeyFallback(key);
      else await this.db.storage().deriveCryptoKey(key);

      // stored after the master key, so a key wrapped with the old master key
      // is never sent with the new revision
      if (resolvedUser.revision === undefined)
        await this.db.kv().delete("masterKeyRevision");
      else await this.db.kv().write("masterKeyRevision", resolvedUser.revision);
    } finally {
      await this.db.kv().delete("masterKeyChangeStartedAt");
    }
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

  /**
   * Adds the keys the user doesn't have yet. The returned user has another
   * device's keys where that device added them first.
   * @param revision revision at which the master key that wrapped the keys
   * was set
   */
  private async addUserKeys(keys: UserKeys, revision?: number): Promise<User> {
    const token = await this.tokenManager.getAccessToken();
    return await http.post.json(
      `${constants.API_HOST}${ENDPOINTS.userKeys}${revisionQuery(revision)}`,
      keys,
      token
    );
  }

  private async getRemoteUser(): Promise<User | undefined> {
    const token = await this.tokenManager.getAccessToken();
    if (!token) return;
    return await http.get(`${constants.API_HOST}${ENDPOINTS.user}`, token);
  }

  private deriveMasterKey(
    salt: string,
    credentials: { password: string; usesFallback?: boolean }
  ) {
    const storage = this.db.storage();
    return credentials.usesFallback
      ? storage.generateCryptoKeyFallback(credentials.password, salt)
      : storage.generateCryptoKey(credentials.password, salt);
  }

  private canUnwrap(key: SerializedKey, cipher: Cipher<"base64">) {
    return this.db
      .storage()
      .decrypt(key, cipher)
      .then(
        () => true,
        () => false
      );
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
    this.keyManager.clearCache();

    const oldUser = await this.getUser();
    try {
      const token = await this.tokenManager.getAccessToken();
      if (!token) return;
      const fetchedUser: User | undefined = await http.get(
        `${constants.API_HOST}${ENDPOINTS.user}`,
        token
      );
      if (!fetchedUser) return oldUser;

      await this.setUser(fetchedUser);
      // keeps a newer stored user, e.g. from a password change
      const user = await this.getUser();
      // only missing if the user logged out while the request was in flight
      if (!user) return;

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
    } catch (e) {
      logger.error(e, "Error fetching user");
      return await this.getUser().catch(() => oldUser);
    }
  }

  /**
   * Resolves the keys of a password change that failed midway, using the
   * password the user just logged in with: if it unwraps them, the password
   * was changed and they are committed, otherwise they are discarded.
   */
  private async resolvePendingKeys(
    user: User,
    credentials: { password: string; usesFallback?: boolean }
  ): Promise<User | undefined> {
    const verifier = anyWrappedKey(user.pendingKeys);
    if (!verifier) return;

    const masterKey = await this.deriveMasterKey(user.salt, credentials);
    const token = await this.tokenManager.getAccessToken();
    const query = revisionQuery(user.revision);
    if (await this.canUnwrap(masterKey, verifier))
      return await http.post.json(
        `${constants.API_HOST}${ENDPOINTS.commitPendingKeys}${query}`,
        null,
        token
      );

    // the current keys match this password, so discarding is only cleanup
    // that the next login can retry
    return await http.post
      .json(
        `${constants.API_HOST}${ENDPOINTS.discardPendingKeys}${query}`,
        null,
        token
      )
      .catch((e) => {
        logger.error(e, "Could not discard pending keys.");
      });
  }

  changePassword(oldPassword: string, newPassword: string) {
    return this.retryIfKeysChanged(() =>
      this.updatePassword("change", {
        old_password: oldPassword,
        new_password: newPassword
      })
    );
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

  resetPassword(options: {
    newPassword: string;
    encryptionKey: SerializedKey;
  }) {
    return this.retryIfKeysChanged(() =>
      this.updatePassword("reset", {
        new_password: options.newPassword,
        encryptionKey: options.encryptionKey
      })
    );
  }

  /**
   * The server rejects a password change made from an outdated copy of the
   * user (`keys_changed`) and keys wrapped with an old master key
   * (`password_changed`), so we fetch the user and try once more. A key
   * wrapped with this device's master key from before a password change on
   * another device is rejected again.
   */
  private async retryIfKeysChanged<T>(callback: () => Promise<T>) {
    try {
      return await callback();
    } catch (e) {
      if (
        !(e instanceof RequestError) ||
        (e.code !== "keys_changed" && e.code !== "password_changed")
      )
        throw e;
      await this.fetchUser();
      return await callback();
    }
  }

  async resetPasswordWithoutRecoveryKey(newPassword: string) {
    if (!newPassword) throw new Error("New password is required.");

    const token = await this.tokenManager.getAccessToken();
    const user = await this.getUser();
    if (!token || !user) throw new Error("You are not logged in.");

    const updateUserPayload: Partial<User> = {};
    const newMasterKey = await this.db
      .storage()
      .generateCryptoKey(newPassword, user.salt);

    updateUserPayload.dataEncryptionKey = await this.keyManager.wrapKey(
      await this.db.crypto().generateRandomKey(),
      newMasterKey
    );

    if (!(await this.resetUser())) throw new Error("Failed to reset user.");

    const updatedUser = await this.patchPassword(
      "reset",
      {
        newPassword: await this.db
          .storage()
          .hash(newPassword, user.email.toLowerCase()),
        userKeys: updateUserPayload
      },
      token,
      newMasterKey
    );
    await this.setMasterKey(updatedUser, { password: newPassword });

    return true;
  }

  async getDataEncryptionKeys(): Promise<
    { version: KeyVersion; key: SerializedKey }[] | undefined
  > {
    const masterKey = await this.getMasterKey();
    logger.info("master key exists: ", { masterKey: !!masterKey });
    if (!masterKey) return;

    const dataEncryptionKey = await this.keyManager.get("dataEncryptionKey", {
      refetchUser: false
    });
    logger.info("DEK exists: ", { dataEncryptionKey: !!dataEncryptionKey });
    if (!dataEncryptionKey)
      return [
        {
          key: masterKey,
          version: KEY_VERSION.LEGACY
        }
      ];
    const keys: { version: KeyVersion; key: SerializedKey }[] = [];

    const legacyDataEncryptionKey = await this.keyManager.get(
      "legacyDataEncryptionKey",
      {
        refetchUser: false
      }
    );
    logger.info("legacy DEK exists: ", {
      legacyDataEncryptionKey: !!legacyDataEncryptionKey
    });
    try {
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
    } catch (e) {
      // the stored keys are newer than the master key; unless the master key
      // is being changed, the user has to log in with the new password
      if (!(await this.isMasterKeyChanging()))
        this.db.eventManager.publish(EVENTS.userSessionExpired);
      throw e;
    }
    logger.info("Keys:", {
      keys: keys.length,
      keyVersions: keys.map((k) => k.version)
    });
    return keys;
  }

  /**
   * Whether the master key is being changed, in this or another tab.
   */
  private async isMasterKeyChanging() {
    const startedAt = await this.db.kv().read("masterKeyChangeStartedAt");
    // a change that is older was interrupted, e.g. by the app being closed
    return (
      startedAt !== undefined &&
      Math.abs(Date.now() - startedAt) < MASTER_KEY_CHANGE_TIMEOUT
    );
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
      return await this.retryIfKeysChanged(async () => {
        // read before the master key, so that a master key change in between
        // can only make the server reject the new key
        const revision = await this.db.kv().read("masterKeyRevision");
        const masterKey = await this.getMasterKey();
        if (!masterKey) return;

        let wrappedKey = (await this.getUser())?.[id] as
          | KeyTypeFromId<TId>
          | undefined;
        if (!wrappedKey) {
          const user = await this.addUserKeys(
            {
              [id]: await this.keyManager.wrapKey(
                await config.generateKey(),
                masterKey
              )
            },
            revision
          );
          await this.setUser(user);
          wrappedKey = user[id] as KeyTypeFromId<TId> | undefined;
          if (!wrappedKey) throw new Error("Key was not saved.");
        }

        return (await this.keyManager.unwrapKey(
          wrappedKey,
          masterKey
        )) as UnwrapKeyReturnType<KeyTypeFromId<TId>>;
      });
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
      generateKey: () => this.db.crypto().generatePGPKeyPair(),
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

    const token = await this.tokenManager.getAccessToken();
    if (!token) return;
    await this.setUser(
      await http.delete(`${constants.API_HOST}${ENDPOINTS.inboxKeys}`, token)
    );
  }

  async saveInboxKeys(keys: SerializedKeyPair) {
    await this.retryIfKeysChanged(async () => {
      // read before the master key, see getUserKey
      const revision = await this.db.kv().read("masterKeyRevision");
      const userEncryptionKey = await this.getMasterKey();
      const token = await this.tokenManager.getAccessToken();
      if (!userEncryptionKey || !token) return;

      await this.setUser(
        await http.put.json(
          `${constants.API_HOST}${ENDPOINTS.inboxKeys}${revisionQuery(
            revision
          )}`,
          {
            public: keys.publicKey,
            private: await this.db
              .storage()
              .encrypt(userEncryptionKey, keys.privateKey)
          },
          token
        )
      );
    });
    this.keyManager.clearCache();
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

    try {
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
    } catch (e) {
      const error = e as Error;
      if (error.message === "Invalid token.") throw new Error("Invalid code.");
      throw error;
    }
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

  private async fetchEncryptionVerifier(): Promise<
    Cipher<"base64"> | undefined
  > {
    const token = await this.tokenManager.getAccessToken();
    return http.get(`${constants.API_HOST}/users/verifier`, token);
  }

  async verifyEncryptionKey(key: SerializedKey) {
    const user = await this.getUser();
    if (!user) throw new Error("User not found.");

    const verifiers = [
      user.attachmentsKey,
      user.monographPasswordsKey,
      user.legacyDataEncryptionKey,
      user.dataEncryptionKey,
      user.inboxKeys?.private
    ].filter((v): v is Cipher<"base64"> => !!v);

    if (verifiers.length === 0) {
      const verifier = await this.fetchEncryptionVerifier();
      if (verifier) verifiers.push(verifier);
      else
        throw new Error(
          "Encryption key cannot be verified: no encryption verifier found."
        );
    }

    for (const verifier of verifiers) {
      if (!(await this.canUnwrap(key, verifier)))
        throw new Error(
          "Your data cannot be decrypted using the provided encryption key."
        );
    }
  }

  private async updatePassword(
    type: "change" | "reset",
    data: {
      new_password: string;
      old_password?: string;
      encryptionKey?: SerializedKey;
    }
  ) {
    const { new_password, old_password } = data;
    if (!new_password) throw new Error("New password is required.");

    const token = await this.tokenManager.getAccessToken();
    let user = await this.getUser();
    // stored by an older version, which can't tell if the keys are outdated
    if (user && user.revision === undefined) user = await this.fetchUser();
    if (!token || !user) throw new Error("You are not logged in.");

    const { email, salt } = user;

    if (old_password && !(await this.verifyPassword(old_password)))
      throw new Error("Incorrect old password.");
    if (old_password && !data.encryptionKey)
      data.encryptionKey = await this.getMasterKey();

    if (!data.encryptionKey) throw new Error("Encryption key is required.");

    // we must be 100% sure that the provided encryption key is valid before
    // proceeding
    await this.verifyEncryptionKey(data.encryptionKey);

    const updateUserPayload: Partial<User> = {};
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
      updateUserPayload.monographPasswordsKey = await this.keyManager.rewrapKey(
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

    if (!user.legacyDataEncryptionKey && !user.dataEncryptionKey) {
      updateUserPayload.dataEncryptionKey = await this.keyManager.wrapKey(
        await this.db.crypto().generateRandomKey(),
        newMasterKey
      );
      updateUserPayload.legacyDataEncryptionKey = await this.keyManager.wrapKey(
        data.encryptionKey,
        newMasterKey
      );
    }

    const oldPassword = old_password
      ? // we don't lowercase email here to allow user accounts with
        // mixed cased emails to change their passwords. Once that is done,
        // we will lowercase the email in the backend.
        await this.db.storage().hash(old_password, email, {
          usesFallback: await this.usesFallbackPWHash(old_password)
        })
      : null;

    const updatedUser = await this.patchPassword(
      type,
      {
        oldPassword: oldPassword,
        newPassword: await this.db
          .storage()
          .hash(new_password, email.toLowerCase()),
        userKeys: updateUserPayload,
        // lets the server reject keys rewrapped from an outdated user
        revision: user.revision
      },
      token,
      newMasterKey
    );
    await this.setMasterKey(updatedUser, { password: new_password });

    return true;
  }

  /**
   * Changes the password and returns the user with the rewrapped keys. A
   * failed request (e.g. a lost response) might still have changed the
   * password, so the user is fetched to check if its keys are rewrapped.
   */
  private async patchPassword(
    type: "change" | "reset",
    body: Record<string, unknown>,
    token: string,
    newMasterKey: SerializedKey
  ): Promise<User> {
    try {
      return await http.patch.json(
        `${constants.API_HOST}/users/password/${type}`,
        body,
        token
      );
    } catch (e) {
      // rejected before anything was changed
      if (
        e instanceof RequestError &&
        (e.code === "keys_changed" || e.code === "password_change_in_progress")
      )
        throw e;

      const user = await this.getRemoteUser().catch(() => undefined);
      const verifier = anyWrappedKey(user);
      if (!user || !verifier || !(await this.canUnwrap(newMasterKey, verifier)))
        throw e;
      return user;
    }
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
