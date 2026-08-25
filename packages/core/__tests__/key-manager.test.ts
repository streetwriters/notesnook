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

import { test, expect, describe } from "vitest";
import { databaseTest, loginFakeUser } from "./utils/index.ts";
import { KeyManager } from "../src/api/key-manager.js";
import { randomBytes } from "../src/utils/random.js";

function validSalt() {
  return randomBytes(16).toString("base64");
}

describe("KeyManager", () => {
  describe("wrapKey + unwrapKey (symmetric key)", () => {
    test("round-trip: wrap then unwrap returns original key", async () => {
      await databaseTest().then(async (db) => {
        await loginFakeUser(db);
        const km = new KeyManager(db);

        const masterKey = await db.user.getMasterKey();
        expect(masterKey).toBeDefined();

        const originalKey = await db.crypto().generateRandomKey();
        const wrapped = await km.wrapKey(originalKey, masterKey!);

        expect(wrapped).toBeDefined();
        expect(wrapped).toHaveProperty("cipher");

        const unwrapped = await km.unwrapKey(wrapped, masterKey!);
        expect(unwrapped).toEqual(originalKey);
      });
    });

    test("unwrap with wrong key throws", async () => {
      await databaseTest().then(async (db) => {
        await loginFakeUser(db);
        const km = new KeyManager(db);

        const masterKey = await db.user.getMasterKey();
        const wrongKey = await db.storage().generateCryptoKey("wrongpassword", validSalt());

        const originalKey = await db.crypto().generateRandomKey();
        const wrapped = await km.wrapKey(originalKey, masterKey!);

        await expect(km.unwrapKey(wrapped, wrongKey)).rejects.toThrow();
      });
    });

    test("wrapped key is a Cipher with base64 format", async () => {
      await databaseTest().then(async (db) => {
        await loginFakeUser(db);
        const km = new KeyManager(db);

        const masterKey = await db.user.getMasterKey();
        const originalKey = await db.crypto().generateRandomKey();
        const wrapped = await km.wrapKey(originalKey, masterKey!);

        expect(wrapped).toHaveProperty("format", "base64");
        expect(wrapped).toHaveProperty("alg");
        expect(typeof (wrapped as any).cipher).toBe("string");
        expect(typeof (wrapped as any).iv).toBe("string");
        expect(typeof (wrapped as any).salt).toBe("string");
      });
    });
  });

  describe("rewrapKey", () => {
    test("symmetric: rewrap succeeds with new key", async () => {
      await databaseTest().then(async (db) => {
        const km = new KeyManager(db);

        const oldKey = await db.storage().generateCryptoKey("oldpassword", validSalt());
        const newKey = await db.storage().generateCryptoKey("newpassword", validSalt());

        const originalKey = await db.crypto().generateRandomKey();
        const wrapped = await km.wrapKey(originalKey, oldKey);

        const rewrapped = await km.rewrapKey(wrapped, oldKey, newKey);

        const unwrapped = await km.unwrapKey(rewrapped, newKey);
        expect(unwrapped).toEqual(originalKey);
      });
    });

    test("symmetric: rewrap fails when unwrap with wrong old key", async () => {
      await databaseTest().then(async (db) => {
        const km = new KeyManager(db);

        const correctOldKey = await db.storage().generateCryptoKey("correct", validSalt());
        const wrongOldKey = await db.storage().generateCryptoKey("wrong", validSalt());
        const newKey = await db.storage().generateCryptoKey("newpassword", validSalt());

        const originalKey = await db.crypto().generateRandomKey();
        const wrapped = await km.wrapKey(originalKey, correctOldKey);

        await expect(km.rewrapKey(wrapped, wrongOldKey, newKey)).rejects.toThrow();
      });
    });

    test("rewrap produces different ciphertext than original", async () => {
      await databaseTest().then(async (db) => {
        const km = new KeyManager(db);

        const key1 = await db.storage().generateCryptoKey("password1", validSalt());
        const key2 = await db.storage().generateCryptoKey("password2", validSalt());

        const originalKey = await db.crypto().generateRandomKey();
        const wrapped = await km.wrapKey(originalKey, key1);
        const rewrapped = await km.rewrapKey(wrapped, key1, key2);

        expect((rewrapped as any).cipher).not.toBe((wrapped as any).cipher);
        expect((rewrapped as any).iv).not.toBe((wrapped as any).iv);
      });
    });
  });

  describe("get() caching", () => {
    test("get() populates cache and returns cached value", async () => {
      await databaseTest().then(async (db) => {
        await loginFakeUser(db);
        const km = new KeyManager(db);

        const key1 = await km.get("attachmentsKey", { useCache: false, refetchUser: false });
        expect(key1).toBeDefined();

        const key2 = await km.get("attachmentsKey", { useCache: true, refetchUser: false });
        expect(key2).toBeDefined();
        expect(key2).toEqual(key1);
      });
    });

    test("clearCache() forces fresh fetch on next get()", async () => {
      await databaseTest().then(async (db) => {
        await loginFakeUser(db);
        const km = new KeyManager(db);

        await km.get("attachmentsKey", { useCache: true, refetchUser: false });
        km.clearCache();

        const key = await km.get("attachmentsKey", { useCache: false, refetchUser: false });
        expect(key).toBeDefined();
      });
    });
  });

  describe("get() edge cases", () => {
    test("get() returns undefined when user has no key for that ID", async () => {
      await databaseTest().then(async (db) => {
        await loginFakeUser(db);
        const km = new KeyManager(db);

        const key = await km.get("dataEncryptionKey", { useCache: false, refetchUser: false });
        expect(key).toBeUndefined();
      });
    });

    test("get() returns undefined when no user exists", async () => {
      await databaseTest().then(async (db) => {
        const km = new KeyManager(db);
        const key = await km.get("attachmentsKey", { useCache: false, refetchUser: false });
        expect(key).toBeUndefined();
      });
    });

    test("get() returns all key types when they exist", async () => {
      await databaseTest().then(async (db) => {
        await loginFakeUser(db);
        const km = new KeyManager(db);

        const masterKey = await db.user.getMasterKey();
        const randomKey = await db.crypto().generateRandomKey();

        const user = await db.user.getUser();
        await db.user.setUser({
          ...user,
          attachmentsKey: await km.wrapKey(randomKey, masterKey!),
          monographPasswordsKey: await km.wrapKey(randomKey, masterKey!),
          dataEncryptionKey: await km.wrapKey(randomKey, masterKey!)
        });

        const attachmentsKey = await km.get("attachmentsKey", { useCache: false, refetchUser: false });
        const monographKey = await km.get("monographPasswordsKey", { useCache: false, refetchUser: false });
        const dek = await km.get("dataEncryptionKey", { useCache: false, refetchUser: false });

        expect(attachmentsKey).toBeDefined();
        expect(monographKey).toBeDefined();
        expect(dek).toBeDefined();
      });
    });
  });

  describe("wrapKey/unwrapKey with password-derived key", () => {
    test("wrap with password key, derive same password, unwrap succeeds", async () => {
      await databaseTest().then(async (db) => {
        const km = new KeyManager(db);
        const salt = validSalt();
        const passwordKey = await db.storage().generateCryptoKey("mypassword", salt);

        const originalKey = await db.crypto().generateRandomKey();
        const wrapped = await km.wrapKey(originalKey, passwordKey);

        const samePasswordKey = await db.storage().generateCryptoKey("mypassword", salt);
        const unwrapped = await km.unwrapKey(wrapped, samePasswordKey);
        expect(unwrapped).toEqual(originalKey);
      });
    });

    test("wrap with different password fails to unwrap", async () => {
      await databaseTest().then(async (db) => {
        const km = new KeyManager(db);

        const key1 = await db.storage().generateCryptoKey("password1", validSalt());
        const key2 = await db.storage().generateCryptoKey("password2", validSalt());

        const originalKey = await db.crypto().generateRandomKey();
        const wrapped = await km.wrapKey(originalKey, key1);

        await expect(km.unwrapKey(wrapped, key2)).rejects.toThrow();
      });
    });
  });

  describe("Data integrity", () => {
    test("wrap/unwrap preserves large symmetric key", async () => {
      await databaseTest().then(async (db) => {
        const km = new KeyManager(db);
        await loginFakeUser(db);

        const masterKey = await db.user.getMasterKey();
        const largeKey = await db.storage().generateCryptoKey("x".repeat(1000), validSalt());

        const wrapped = await km.wrapKey(largeKey, masterKey!);
        const unwrapped = await km.unwrapKey(wrapped, masterKey!);
        expect(unwrapped).toEqual(largeKey);
      });
    });

    test("multiple wrap/unwrap cycles with different keys", async () => {
      await databaseTest().then(async (db) => {
        const km = new KeyManager(db);

        let currentKey = await db.storage().generateCryptoKey("initial", validSalt());
        const originalData = await db.crypto().generateRandomKey();

        const key2 = await db.storage().generateCryptoKey("second", validSalt());
        const key3 = await db.storage().generateCryptoKey("third", validSalt());

        let wrapped = await km.wrapKey(originalData, currentKey);
        wrapped = await km.rewrapKey(wrapped, currentKey, key2);
        wrapped = await km.rewrapKey(wrapped, key2, key3);
        wrapped = await km.rewrapKey(wrapped, key3, currentKey);

        const unwrapped = await km.unwrapKey(wrapped, currentKey);
        expect(unwrapped).toEqual(originalData);
      });
    });
  });
});
