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
import { databaseTest } from "./utils/index.ts";
import { randomBytes } from "../src/utils/random.js";

function validSalt() {
  return randomBytes(16).toString("base64");
}

describe("Storage encrypt/decrypt via database", () => {
  test("encrypt + decrypt round-trip through storage", async () => {
    await databaseTest().then(async (db) => {
      const key = await db.crypto().generateRandomKey();
      const plaintext = "test data for storage";
      const cipher = await db.storage().encrypt(key, plaintext);
      const decrypted = await db.storage().decrypt(key, cipher);
      expect(decrypted).toBe(plaintext);
    });
  });

  test("deriveCryptoKey stores key, getCryptoKey retrieves it", async () => {
    await databaseTest().then(async (db) => {
      const salt = validSalt();
      await db.storage().deriveCryptoKey({ password: "mypassword", salt });
      const storedKey = await db.storage().getCryptoKey();
      expect(storedKey).toBeDefined();
      expect(typeof storedKey).toBe("string");
      expect(storedKey!.length).toBeGreaterThan(0);
    });
  });

  test("generateCryptoKey returns SerializedKey", async () => {
    await databaseTest().then(async (db) => {
      const salt = validSalt();
      const generated = await db.storage().generateCryptoKey("password", salt);
      expect(generated.salt).toBe(salt);
      expect(generated.key).toBeDefined();
    });
  });

  test("generateCryptoKey without salt generates one", async () => {
    await databaseTest().then(async (db) => {
      const generated = await db.storage().generateCryptoKey("password");
      expect(generated.salt).toBeDefined();
    });
  });

  test("encrypt with derived key works after deriveCryptoKey", async () => {
    await databaseTest().then(async (db) => {
      const salt = validSalt();
      const password = "secure-password";

      await db.storage().deriveCryptoKey({ password, salt });
      const keyStr = await db.storage().getCryptoKey();

      const key = { key: keyStr!, salt };
      const plaintext = "encrypted with derived key";
      const cipher = await db.storage().encrypt(key, plaintext);
      const decrypted = await db.storage().decrypt(key, cipher);
      expect(decrypted).toBe(plaintext);
    });
  });

  test("deriveCryptoKey with empty password or salt is a no-op", async () => {
    await databaseTest().then(async (db) => {
      await db.storage().deriveCryptoKey({ password: "", salt: "salt" });
      const key = await db.storage().getCryptoKey();
      expect(key).toBeUndefined();

      await db.storage().deriveCryptoKey({ password: "pass", salt: "" });
      const key2 = await db.storage().getCryptoKey();
      expect(key2).toBeUndefined();
    });
  });

  test("encryptMulti/decryptMulti round-trip through storage", async () => {
    await databaseTest().then(async (db) => {
      const key = await db.crypto().generateRandomKey();
      const items = ["hello", "world", "test123"];
      const ciphers = await db.storage().encryptMulti(key, items);
      const decrypted = await db.storage().decryptMulti(key, ciphers);
      expect(decrypted).toEqual(items);
    });
  });
});
