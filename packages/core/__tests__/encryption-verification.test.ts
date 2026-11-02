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
import { databaseTest, loginFakeUser } from "./utils/index.ts";
import { KeyManager } from "../src/api/key-manager.js";
import { randomBytes } from "../src/utils/random.js";

// ─── verifyPassword ────────────────────────────────────────────────

describe("UserManager.verifyPassword", () => {
  test("correct password returns true", async () => {
    await databaseTest().then(async (db) => {
      await loginFakeUser(db);
      const result = await db.user.verifyPassword("password");
      expect(result).toBe(true);
    });
  });

  test("incorrect password returns false", async () => {
    await databaseTest().then(async (db) => {
      await loginFakeUser(db);
      const result = await db.user.verifyPassword("wrongpassword");
      expect(result).toBe(false);
    });
  });

  test("no user returns false", async () => {
    await databaseTest().then(async (db) => {
      const result = await db.user.verifyPassword("anything");
      expect(result).toBe(false);
    });
  });

  test("no master key returns false", async () => {
    await databaseTest().then(async (db) => {
      const userSalt = randomBytes(16).toString("base64");
      await db.user.setUser({
        id: "user-123",
        email: "test@example.com",
        isEmailConfirmed: true,
        salt: userSalt,
        mfa: { isEnabled: false, primaryMethod: "app", remainingValidCodes: 0 },
        subscription: { appId: 0, cancelURL: null, expiry: 0, productId: null, provider: "none", start: 0, plan: "free", status: "trial", updateURL: null, googlePurchaseToken: null }
      } as any);
      const result = await db.user.verifyPassword("anything");
      expect(result).toBe(false);
    });
  });
});

// ─── verifyEncryptionKey ───────────────────────────────────────────

describe("UserManager.verifyEncryptionKey", () => {
  describe("user with both legacyDataEncryptionKey and dataEncryptionKey", () => {
    test("valid key does not throw", async () => {
      await databaseTest().then(async (db) => {
        const password = "mypassword";
        const salt = randomBytes(16).toString("base64");
        // Set up user with crypto key derived from our password
        await db.user.setUser({
          id: "user-123", email: "test@example.com", isEmailConfirmed: true,
          salt, mfa: { isEnabled: false, primaryMethod: "app", remainingValidCodes: 0 },
          subscription: { appId: 0, cancelURL: null, expiry: 0, productId: null, provider: "none", start: 0, plan: "free", status: "trial", updateURL: null, googlePurchaseToken: null }
        } as any);
        await db.storage().deriveCryptoKey({ password, salt });
        const masterKey = await db.user.getMasterKey();
        const km = new KeyManager(db);

        const randomKey = await db.crypto().generateRandomKey();
        const legacyDEK = await km.wrapKey(randomKey, masterKey!);
        const dek = await km.wrapKey(randomKey, masterKey!);

        const user = await db.user.getUser();
        await db.user.setUser({ ...user, legacyDataEncryptionKey: legacyDEK, dataEncryptionKey: dek });

        await expect(
          db.user.verifyEncryptionKey({ password, salt })
        ).resolves.toBeUndefined();
      });
    });

    test("invalid key throws", async () => {
      await databaseTest().then(async (db) => {
        const password = "correct";
        const salt = randomBytes(16).toString("base64");
        await db.user.setUser({
          id: "user-123", email: "test@example.com", isEmailConfirmed: true,
          salt, mfa: { isEnabled: false, primaryMethod: "app", remainingValidCodes: 0 },
          subscription: { appId: 0, cancelURL: null, expiry: 0, productId: null, provider: "none", start: 0, plan: "free", status: "trial", updateURL: null, googlePurchaseToken: null }
        } as any);
        await db.storage().deriveCryptoKey({ password, salt });
        const masterKey = await db.user.getMasterKey();
        const km = new KeyManager(db);

        const randomKey = await db.crypto().generateRandomKey();
        const legacyDEK = await km.wrapKey(randomKey, masterKey!);
        const dek = await km.wrapKey(randomKey, masterKey!);

        const user = await db.user.getUser();
        await db.user.setUser({ ...user, legacyDataEncryptionKey: legacyDEK, dataEncryptionKey: dek });

        await expect(
          db.user.verifyEncryptionKey({ password: "wrongpassword", salt })
        ).rejects.toThrow();
      });
    });
  });

  describe("user with neither legacyDataEncryptionKey nor dataEncryptionKey", () => {
    test("valid key using attachmentsKey verifier does not throw", async () => {
      await databaseTest().then(async (db) => {
        const password = "mypassword";
        const salt = randomBytes(16).toString("base64");
        await db.user.setUser({
          id: "user-123", email: "test@example.com", isEmailConfirmed: true,
          salt, mfa: { isEnabled: false, primaryMethod: "app", remainingValidCodes: 0 },
          subscription: { appId: 0, cancelURL: null, expiry: 0, productId: null, provider: "none", start: 0, plan: "free", status: "trial", updateURL: null, googlePurchaseToken: null }
        } as any);
        await db.storage().deriveCryptoKey({ password, salt });
        const masterKey = await db.user.getMasterKey();
        const km = new KeyManager(db);

        const key = await db.crypto().generateRandomKey();
        const attachmentsKey = await km.wrapKey(key, masterKey!);

        const user = await db.user.getUser();
        await db.user.setUser({ ...user, attachmentsKey });

        await expect(
          db.user.verifyEncryptionKey({ password, salt })
        ).resolves.toBeUndefined();
      });
    });

    test("invalid key using attachmentsKey verifier throws", async () => {
      await databaseTest().then(async (db) => {
        const password = "correct";
        const salt = randomBytes(16).toString("base64");
        await db.user.setUser({
          id: "user-123", email: "test@example.com", isEmailConfirmed: true,
          salt, mfa: { isEnabled: false, primaryMethod: "app", remainingValidCodes: 0 },
          subscription: { appId: 0, cancelURL: null, expiry: 0, productId: null, provider: "none", start: 0, plan: "free", status: "trial", updateURL: null, googlePurchaseToken: null }
        } as any);
        await db.storage().deriveCryptoKey({ password, salt });
        const masterKey = await db.user.getMasterKey();
        const km = new KeyManager(db);

        const key = await db.crypto().generateRandomKey();
        const attachmentsKey = await km.wrapKey(key, masterKey!);

        const user = await db.user.getUser();
        await db.user.setUser({ ...user, attachmentsKey });

        await expect(
          db.user.verifyEncryptionKey({ password: "wrongpassword", salt })
        ).rejects.toThrow(
          "Your data cannot be decrypted using the provided encryption key."
        );
      });
    });

    test("uses monographPasswordsKey when no attachmentsKey exists", async () => {
      await databaseTest().then(async (db) => {
        const password = "mypassword";
        const salt = randomBytes(16).toString("base64");
        await db.user.setUser({
          id: "user-123", email: "test@example.com", isEmailConfirmed: true,
          salt, mfa: { isEnabled: false, primaryMethod: "app", remainingValidCodes: 0 },
          subscription: { appId: 0, cancelURL: null, expiry: 0, productId: null, provider: "none", start: 0, plan: "free", status: "trial", updateURL: null, googlePurchaseToken: null }
        } as any);
        await db.storage().deriveCryptoKey({ password, salt });
        const masterKey = await db.user.getMasterKey();
        const km = new KeyManager(db);

        const key = await db.crypto().generateRandomKey();
        const monographKey = await km.wrapKey(key, masterKey!);

        const user = await db.user.getUser();
        // Ensure no attachmentsKey, only monographPasswordsKey
        await db.user.setUser({ ...user, attachmentsKey: undefined, monographPasswordsKey: monographKey });

        await expect(
          db.user.verifyEncryptionKey({ password, salt })
        ).resolves.toBeUndefined();
      });
    });

    test("fetches verifier from server when no local keys exist", async () => {
      const http = (await import("../src/utils/http.js")).default;
      const mockGet = vi.spyOn(http, "get").mockResolvedValue(undefined);

      await databaseTest().then(async (db) => {
        const password = "mypassword";
        const salt = randomBytes(16).toString("base64");
        await db.user.setUser({
          id: "user-123", email: "test@example.com", isEmailConfirmed: true,
          salt, mfa: { isEnabled: false, primaryMethod: "app", remainingValidCodes: 0 },
          subscription: { appId: 0, cancelURL: null, expiry: 0, productId: null, provider: "none", start: 0, plan: "free", status: "trial", updateURL: null, googlePurchaseToken: null }
        } as any);
        await db.storage().deriveCryptoKey({ password, salt });

        // Set a token so getAccessToken returns something
        await db.kv().write("token", {
          access_token: "fake-token",
          t: Date.now(),
          expires_in: 3600,
          scope: "notesnook.sync IdentityServerApi",
          refresh_token: "fake-refresh"
        });

        // No attachmentsKey, no monographPasswordsKey
        // Server returns undefined — should throw
        await expect(
          db.user.verifyEncryptionKey({ password, salt })
        ).rejects.toThrow(
          "Encryption key cannot be verified: no encryption verifier found."
        );
      });

      mockGet.mockRestore();
    });

    test("uses server-provided verifier cipher when available", async () => {
      const http = (await import("../src/utils/http.js")).default;

      await databaseTest().then(async (db) => {
        const password = "mypassword";
        const salt = randomBytes(16).toString("base64");
        await db.user.setUser({
          id: "user-123", email: "test@example.com", isEmailConfirmed: true,
          salt, mfa: { isEnabled: false, primaryMethod: "app", remainingValidCodes: 0 },
          subscription: { appId: 0, cancelURL: null, expiry: 0, productId: null, provider: "none", start: 0, plan: "free", status: "trial", updateURL: null, googlePurchaseToken: null }
        } as any);
        await db.storage().deriveCryptoKey({ password, salt });

        await db.kv().write("token", {
          access_token: "fake-token",
          t: Date.now(),
          expires_in: 3600,
          scope: "notesnook.sync IdentityServerApi",
          refresh_token: "fake-refresh"
        });

        // Create a verifier cipher that the correct key can decrypt
        const verifierCipher = await db.storage().encrypt(
          { password, salt },
          "test-data"
        );
        const mockGet = vi.spyOn(http, "get").mockResolvedValueOnce(verifierCipher);

        await expect(
          db.user.verifyEncryptionKey({ password, salt })
        ).resolves.toBeUndefined();

        expect(mockGet).toHaveBeenCalledWith(
          expect.stringContaining("/users/verifier"),
          "fake-token"
        );
        mockGet.mockRestore();
      });
    });

    test("server verifier rejects wrong key", async () => {
      const http = (await import("../src/utils/http.js")).default;

      await databaseTest().then(async (db) => {
        const salt = randomBytes(16).toString("base64");
        await db.user.setUser({
          id: "user-123", email: "test@example.com", isEmailConfirmed: true,
          salt, mfa: { isEnabled: false, primaryMethod: "app", remainingValidCodes: 0 },
          subscription: { appId: 0, cancelURL: null, expiry: 0, productId: null, provider: "none", start: 0, plan: "free", status: "trial", updateURL: null, googlePurchaseToken: null }
        } as any);
        await db.storage().deriveCryptoKey({ password: "correct-password", salt });

        await db.kv().write("token", {
          access_token: "fake-token",
          t: Date.now(),
          expires_in: 3600,
          scope: "notesnook.sync IdentityServerApi",
          refresh_token: "fake-refresh"
        });

        // Verifier encrypted with correct password
        const verifierCipher = await db.storage().encrypt(
          { password: "correct-password", salt },
          "test-data"
        );
        const mockGet = vi.spyOn(http, "get").mockResolvedValueOnce(verifierCipher);

        // Wrong key should fail verification
        await expect(
          db.user.verifyEncryptionKey({ password: "wrong-password", salt })
        ).rejects.toThrow(
          "Your data cannot be decrypted using the provided encryption key."
        );

        mockGet.mockRestore();
      });
    });
  });

  describe("user with only one of legacy DEK or DEK", () => {
    test("succeeds when only dataEncryptionKey exists", async () => {
      await databaseTest().then(async (db) => {
        const password = "password";
        const salt = randomBytes(16).toString("base64");
        await db.user.setUser({
          id: "user-123", email: "test@example.com", isEmailConfirmed: true,
          salt, mfa: { isEnabled: false, primaryMethod: "app", remainingValidCodes: 0 },
          subscription: { appId: 0, cancelURL: null, expiry: 0, productId: null, provider: "none", start: 0, plan: "free", status: "trial", updateURL: null, googlePurchaseToken: null }
        } as any);
        await db.storage().deriveCryptoKey({ password, salt });
        const masterKey = await db.user.getMasterKey();
        const km = new KeyManager(db);

        const randomKey = await db.crypto().generateRandomKey();
        const dek = await km.wrapKey(randomKey, masterKey!);

        const user = await db.user.getUser();
        await db.user.setUser({ ...user, dataEncryptionKey: dek });

        await expect(
          db.user.verifyEncryptionKey({ password, salt })
        ).resolves.toBeUndefined();
      });
    });

    test("succeeds when only legacyDataEncryptionKey exists", async () => {
      await databaseTest().then(async (db) => {
        const password = "password";
        const salt = randomBytes(16).toString("base64");
        await db.user.setUser({
          id: "user-123", email: "test@example.com", isEmailConfirmed: true,
          salt, mfa: { isEnabled: false, primaryMethod: "app", remainingValidCodes: 0 },
          subscription: { appId: 0, cancelURL: null, expiry: 0, productId: null, provider: "none", start: 0, plan: "free", status: "trial", updateURL: null, googlePurchaseToken: null }
        } as any);
        await db.storage().deriveCryptoKey({ password, salt });
        const masterKey = await db.user.getMasterKey();
        const km = new KeyManager(db);

        const randomKey = await db.crypto().generateRandomKey();
        const legacyDEK = await km.wrapKey(randomKey, masterKey!);

        const user = await db.user.getUser();
        await db.user.setUser({ ...user, legacyDataEncryptionKey: legacyDEK });

        await expect(
          db.user.verifyEncryptionKey({ password, salt })
        ).resolves.toBeUndefined();
      });
    });

    test("invalid key throws even when only a single DEK exists", async () => {
      await databaseTest().then(async (db) => {
        const password = "correct";
        const salt = randomBytes(16).toString("base64");
        await db.user.setUser({
          id: "user-123", email: "test@example.com", isEmailConfirmed: true,
          salt, mfa: { isEnabled: false, primaryMethod: "app", remainingValidCodes: 0 },
          subscription: { appId: 0, cancelURL: null, expiry: 0, productId: null, provider: "none", start: 0, plan: "free", status: "trial", updateURL: null, googlePurchaseToken: null }
        } as any);
        await db.storage().deriveCryptoKey({ password, salt });
        const masterKey = await db.user.getMasterKey();
        const km = new KeyManager(db);

        const randomKey = await db.crypto().generateRandomKey();
        const dek = await km.wrapKey(randomKey, masterKey!);

        const user = await db.user.getUser();
        await db.user.setUser({ ...user, dataEncryptionKey: dek });

        await expect(
          db.user.verifyEncryptionKey({ password: "wrongpassword", salt })
        ).rejects.toThrow(
          "Your data cannot be decrypted using the provided encryption key."
        );
      });
    });
  });

  describe("no user", () => {
    test("throws when no user exists", async () => {
      await databaseTest().then(async (db) => {
        await expect(
          db.user.verifyEncryptionKey({ password: "test", salt: "salt" })
        ).rejects.toThrow("User not found.");
      });
    });
  });
});
