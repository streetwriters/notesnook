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

import { test, expect, describe, vi } from "vitest";
import { databaseTest } from "./utils/index.ts";
import { KeyManager } from "../src/api/key-manager.js";
import { randomBytes } from "../src/utils/random.js";

const FULL_USER: any = {
  id: "user-123",
  email: "test@example.com",
  isEmailConfirmed: true,
  salt: "",
  mfa: { isEnabled: false, primaryMethod: "app", remainingValidCodes: 0 },
  subscription: { appId: 0, cancelURL: null, expiry: 0, productId: null, provider: "none", start: 0, plan: "free", status: "trial", updateURL: null, googlePurchaseToken: null }
};

vi.mock("../src/utils/http.js", () => ({
  default: {
    get: vi.fn().mockResolvedValue(undefined),
    post: vi.fn().mockResolvedValue(undefined),
    patch: { json: vi.fn().mockResolvedValue(undefined) },
    delete: vi.fn().mockResolvedValue(undefined)
  }
}));

async function setupLoggedInUser(db: any, password: string = "oldpassword") {
  const salt = randomBytes(16).toString("base64");
  const user = { ...FULL_USER, salt };
  await db.user.setUser(user);
  await db.storage().deriveCryptoKey({ password, salt });

  await db.kv().write("token", {
    access_token: "fake-token",
    t: Date.now(),
    expires_in: 3600,
    scope: "notesnook.sync offline_access IdentityServerApi",
    refresh_token: "fake-refresh"
  });

  const km = new KeyManager(db);
  const masterKey = await db.user.getMasterKey();
  const randomKey = await db.crypto().generateRandomKey();

  const attachmentsKey = await km.wrapKey(randomKey, masterKey!);
  const monographPasswordsKey = await km.wrapKey(randomKey, masterKey!);
  const dek = await km.wrapKey(randomKey, masterKey!);
  const legacyDEK = await km.wrapKey(randomKey, masterKey!);

  await db.user.setUser({
    ...user,
    attachmentsKey,
    monographPasswordsKey,
    dataEncryptionKey: dek,
    legacyDataEncryptionKey: legacyDEK
  });

  return { password, salt, masterKey, randomKey };
}

// ─── _updatePassword (change) ──────────────────────────────────────

describe("UserManager._updatePassword (change)", () => {
  test("successful password change rewraps all keys and derives new master key", async () => {
    await databaseTest().then(async (db) => {
      await setupLoggedInUser(db, "oldpassword");
      const result = await db.user.changePassword("oldpassword", "newpassword");
      expect(result).toBe(true);
      const newMasterKey = await db.user.getMasterKey();
      expect(newMasterKey).toBeDefined();
      expect(newMasterKey!.key).not.toBe("");
    });
  });

  test("wrong old password throws 'Incorrect old password'", async () => {
    await databaseTest().then(async (db) => {
      await setupLoggedInUser(db, "oldpassword");
      await expect(
        db.user.changePassword("wrongpassword", "newpassword")
      ).rejects.toThrow("Incorrect old password");
    });
  });

  test("empty new password throws 'New password is required'", async () => {
    await databaseTest().then(async (db) => {
      await setupLoggedInUser(db, "oldpassword");
      await expect(
        db.user.changePassword("oldpassword", "")
      ).rejects.toThrow("New password is required");
    });
  });

  test("no logged in user throws", async () => {
    await databaseTest().then(async (db) => {
      await expect(
        db.user.changePassword("oldpassword", "newpassword")
      ).rejects.toThrow();
    });
  });

  test("keys are rewrapped: old master key can no longer unwrap", async () => {
    await databaseTest().then(async (db) => {
      const { masterKey: oldMasterKey } = await setupLoggedInUser(db, "oldpassword");
      await db.user.changePassword("oldpassword", "newpassword");

      const user = await db.user.getUser();
      const km = new KeyManager(db);

      if (user.attachmentsKey) {
        await expect(
          km.unwrapKey(user.attachmentsKey, oldMasterKey!)
        ).rejects.toThrow();
      }
    });
  });

  test("new master key can unwrap all rewrapped keys", async () => {
    await databaseTest().then(async (db) => {
      await setupLoggedInUser(db, "oldpassword");
      await db.user.changePassword("oldpassword", "newpassword");

      const newMasterKey = await db.user.getMasterKey();
      const user = await db.user.getUser();
      const km = new KeyManager(db);

      if (user.attachmentsKey) {
        const key = await km.unwrapKey(user.attachmentsKey, newMasterKey!);
        expect(key).toBeDefined();
      }
      if (user.monographPasswordsKey) {
        const key = await km.unwrapKey(user.monographPasswordsKey, newMasterKey!);
        expect(key).toBeDefined();
      }
      if (user.dataEncryptionKey) {
        const key = await km.unwrapKey(user.dataEncryptionKey, newMasterKey!);
        expect(key).toBeDefined();
      }
      if (user.legacyDataEncryptionKey) {
        const key = await km.unwrapKey(user.legacyDataEncryptionKey, newMasterKey!);
        expect(key).toBeDefined();
      }
    });
  });

  test("rewrapped user keys are stored with new ciphertext", async () => {
    await databaseTest().then(async (db) => {
      await setupLoggedInUser(db, "oldpassword");
      const km = new KeyManager(db);

      // Fetch the attachmentsKey BEFORE password change
      const oldKey = await km.get("attachmentsKey", {
        useCache: false,
        refetchUser: false
      });
      expect(oldKey).toBeDefined();
      const oldCipher = (oldKey as any).cipher;

      // Change password — keys are rewrapped and user is updated
      await db.user.changePassword("oldpassword", "newpassword");

      // The new user object in KV should have a rewrapped attachmentsKey
      // (with new ciphertext)
      const newKey = await km.get("attachmentsKey", {
        useCache: false,
        refetchUser: false
      });
      expect(newKey).toBeDefined();
      // The re-fetched cipher MUST differ from the old one because the key
      // was re-wrapped with a new master key (different ciphertext).
      expect((newKey as any).cipher).not.toBe(oldCipher);

      // Verify the new key can be unwrapped with the new master key
      const newMasterKey = await db.user.getMasterKey();
      const unwrapped = await km.unwrapKey(newKey, newMasterKey!);
      expect(unwrapped).toBeDefined();
    });
  });
});

// ─── _updatePassword (reset) ───────────────────────────────────────

describe("UserManager._updatePassword (reset)", () => {
  test("successful reset with explicit encryption key", async () => {
    await databaseTest().then(async (db) => {
      const { password, salt } = await setupLoggedInUser(db, "oldpassword");
      const result = await db.user.resetPassword({
        newPassword: "newpassword",
        encryptionKey: { password, salt }
      });
      expect(result).toBe(true);
      const newMasterKey = await db.user.getMasterKey();
      expect(newMasterKey).toBeDefined();
    });
  });

  test("reset without encryption key throws", async () => {
    await databaseTest().then(async (db) => {
      await setupLoggedInUser(db, "oldpassword");
      await expect(
        db.user.resetPassword({ newPassword: "newpassword" } as any)
      ).rejects.toThrow("Encryption key is required.");
    });
  });

  test("empty new password throws 'New password is required'", async () => {
    await databaseTest().then(async (db) => {
      const { password, salt } = await setupLoggedInUser(db, "oldpassword");
      await expect(
        db.user.resetPassword({ newPassword: "", encryptionKey: { password, salt } })
      ).rejects.toThrow("New password is required");
    });
  });

  test("reset with wrong encryption key throws during verification", async () => {
    await databaseTest().then(async (db) => {
      await setupLoggedInUser(db, "oldpassword");
      await expect(
        db.user.resetPassword({
          newPassword: "newpassword",
          encryptionKey: { password: "wrongpassword", salt: "wrongsalt" }
        })
      ).rejects.toThrow();
    });
  });
});

// ─── Key migration scenarios ───────────────────────────────────────

describe("Key migration during password change", () => {
  test("legacy user (no DEK, no legacy DEK) gets new DEK and legacy DEK created", async () => {
    await databaseTest().then(async (db) => {
      const password = "oldpassword";
      const salt = randomBytes(16).toString("base64");
      await db.user.setUser({ ...FULL_USER, salt });
      await db.storage().deriveCryptoKey({ password, salt });

      await db.kv().write("token", {
        access_token: "fake-token", t: Date.now(), expires_in: 3600,
        scope: "notesnook.sync offline_access IdentityServerApi", refresh_token: "fake-refresh"
      });

      const km = new KeyManager(db);
      const masterKey = await db.user.getMasterKey();
      const randomKey = await db.crypto().generateRandomKey();
      const attachmentsKey = await km.wrapKey(randomKey, masterKey!);

      await db.user.setUser({ ...FULL_USER, salt, attachmentsKey });

      const result = await db.user.changePassword("oldpassword", "newpassword");
      expect(result).toBe(true);

      const user = await db.user.getUser();
      expect(user.dataEncryptionKey).toBeDefined();
      expect(user.legacyDataEncryptionKey).toBeDefined();
    });
  });

  test("user with both DEK and legacy DEK: both are rewrapped", async () => {
    await databaseTest().then(async (db) => {
      await setupLoggedInUser(db, "oldpassword");
      const userBefore = await db.user.getUser();
      const originalDEKCipher = userBefore.dataEncryptionKey?.cipher;
      const originalLegacyDEKCipher = userBefore.legacyDataEncryptionKey?.cipher;

      await db.user.changePassword("oldpassword", "newpassword");

      const userAfter = await db.user.getUser();
      expect(userAfter.dataEncryptionKey?.cipher).not.toBe(originalDEKCipher);
      expect(userAfter.legacyDataEncryptionKey?.cipher).not.toBe(originalLegacyDEKCipher);
    });
  });

  test("user with only DEK (no legacy): password change fails verification", async () => {
    await databaseTest().then(async (db) => {
      const password = "oldpassword";
      const salt = randomBytes(16).toString("base64");
      await db.user.setUser({ ...FULL_USER, salt });
      await db.storage().deriveCryptoKey({ password, salt });

      await db.kv().write("token", {
        access_token: "fake-token", t: Date.now(), expires_in: 3600,
        scope: "notesnook.sync offline_access IdentityServerApi", refresh_token: "fake-refresh"
      });

      const km = new KeyManager(db);
      const masterKey = await db.user.getMasterKey();
      const randomKey = await db.crypto().generateRandomKey();
      const dek = await km.wrapKey(randomKey, masterKey!);

      await db.user.setUser({ ...FULL_USER, salt, dataEncryptionKey: dek });

      // verifyEncryptionKey throws when only one of legacy DEK or DEK exists
      await expect(
        db.user.changePassword("oldpassword", "newpassword")
      ).rejects.toThrow(
        "Cannot verify the provided encryption key as user has only a single encryption key."
      );
    });
  });

  test("inbox keys are rewrapped during password change", async () => {
    await databaseTest().then(async (db) => {
      await setupLoggedInUser(db, "oldpassword");

      const km = new KeyManager(db);
      const masterKey = await db.user.getMasterKey();
      // Use a fake keypair since generatePGPKeyPair depends on unavailable sodium API
      const fakeKeyPair = { publicKey: "fake-public-key", privateKey: "fake-private-key" };
      const wrappedInboxKeys = await km.wrapKey(fakeKeyPair as any, masterKey!);

      const user = await db.user.getUser();
      await db.user.setUser({ ...user, inboxKeys: wrappedInboxKeys });

      await db.user.changePassword("oldpassword", "newpassword");

      const userAfter = await db.user.getUser();
      const newMasterKey = await db.user.getMasterKey();
      expect(userAfter.inboxKeys).toBeDefined();
      const unwrappedKeypair = await km.unwrapKey(userAfter.inboxKeys, newMasterKey!);
      expect((unwrappedKeypair as any).publicKey).toBe(fakeKeyPair.publicKey);
      expect((unwrappedKeypair as any).privateKey).toBe(fakeKeyPair.privateKey);
    });
  });
});

// ─── getDataEncryptionKeys ─────────────────────────────────────────

describe("UserManager.getDataEncryptionKeys", () => {
  test("returns LEGACY version when no DEK exists", async () => {
    await databaseTest().then(async (db) => {
      const salt = randomBytes(16).toString("base64");
      await db.user.setUser({ ...FULL_USER, salt });
      await db.storage().deriveCryptoKey({ password: "password", salt });

      const keys = await db.user.getDataEncryptionKeys();
      expect(keys).toBeDefined();
      expect(keys!.length).toBe(1);
      expect(keys![0].version).toBe(0); // KEY_VERSION.LEGACY
    });
  });

  test("returns DEK version when DEK exists", async () => {
    await databaseTest().then(async (db) => {
      await setupLoggedInUser(db);
      const keys = await db.user.getDataEncryptionKeys();
      expect(keys).toBeDefined();
      expect(keys!.length).toBeGreaterThanOrEqual(1);
      const dekVersion = keys!.find((k: any) => k.version === 1);
      expect(dekVersion).toBeDefined();
    });
  });

  test("returns both LEGACY and DEK when both exist", async () => {
    await databaseTest().then(async (db) => {
      await setupLoggedInUser(db);
      const keys = await db.user.getDataEncryptionKeys();
      expect(keys).toBeDefined();
      expect(keys!.length).toBe(2);
      const versions = keys!.map((k: any) => k.version);
      expect(versions).toContain(0);
      expect(versions).toContain(1);
    });
  });

  test("returns undefined when no master key exists", async () => {
    await databaseTest().then(async (db) => {
      const keys = await db.user.getDataEncryptionKeys();
      expect(keys).toBeUndefined();
    });
  });
});
