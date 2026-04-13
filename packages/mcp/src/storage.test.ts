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

import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import BetterSQLite3 from "better-sqlite3-multiple-ciphers";
import { NodeStorageInterface } from "./storage.js";

let dir: string;
let db: ReturnType<typeof BetterSQLite3>;
let storage: NodeStorageInterface;

beforeEach(() => {
  dir = path.join(tmpdir(), `notesnook-storage-test-${Date.now()}`);
  mkdirSync(dir, { recursive: true });
  db = BetterSQLite3(path.join(dir, "test.sqlite")).unsafeMode(true);
  storage = new NodeStorageInterface(db);
});

afterEach(() => {
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

describe("NodeStorageInterface", () => {
  test("write and read a value", async () => {
    await storage.write("key1", { hello: "world" });
    const result = await storage.read<{ hello: string }>("key1");
    expect(result).toEqual({ hello: "world" });
  });

  test("read returns undefined for missing key", async () => {
    const result = await storage.read("nonexistent");
    expect(result).toBeUndefined();
  });

  test("write overwrites existing value", async () => {
    await storage.write("key1", "first");
    await storage.write("key1", "second");
    expect(await storage.read("key1")).toBe("second");
  });

  test("writeMulti and readMulti", async () => {
    await storage.writeMulti([
      ["a", 1],
      ["b", 2],
      ["c", 3]
    ]);
    const results = await storage.readMulti<number>(["a", "c"]);
    expect(results).toHaveLength(2);
    const map = Object.fromEntries(results);
    expect(map["a"]).toBe(1);
    expect(map["c"]).toBe(3);
  });

  test("readMulti returns empty array for empty keys", async () => {
    const results = await storage.readMulti([]);
    expect(results).toEqual([]);
  });

  test("remove deletes a key", async () => {
    await storage.write("del", "value");
    await storage.remove("del");
    expect(await storage.read("del")).toBeUndefined();
  });

  test("remove on missing key is a no-op", async () => {
    await expect(storage.remove("ghost")).resolves.toBeUndefined();
  });

  test("removeMulti deletes multiple keys", async () => {
    await storage.writeMulti([
      ["x", 1],
      ["y", 2],
      ["z", 3]
    ]);
    await storage.removeMulti(["x", "z"]);
    expect(await storage.read("x")).toBeUndefined();
    expect(await storage.read("y")).toBe(2);
    expect(await storage.read("z")).toBeUndefined();
  });

  test("removeMulti with empty array is a no-op", async () => {
    await storage.write("keep", "yes");
    await storage.removeMulti([]);
    expect(await storage.read("keep")).toBe("yes");
  });

  test("clear removes all keys", async () => {
    await storage.writeMulti([
      ["a", 1],
      ["b", 2]
    ]);
    await storage.clear();
    expect(await storage.getAllKeys()).toEqual([]);
  });

  test("getAllKeys returns all stored keys", async () => {
    await storage.writeMulti([
      ["k1", "v1"],
      ["k2", "v2"]
    ]);
    const keys = await storage.getAllKeys();
    expect(keys.sort()).toEqual(["k1", "k2"]);
  });

  test("stores and retrieves null", async () => {
    await storage.write("nullkey", null);
    expect(await storage.read("nullkey")).toBeNull();
  });

  test("stores and retrieves arrays", async () => {
    await storage.write("arr", [1, 2, 3]);
    expect(await storage.read("arr")).toEqual([1, 2, 3]);
  });

  test("deriveCryptoKey and getCryptoKey round-trip", async () => {
    // generateCryptoKey produces a properly-sized salt (16 random bytes as base64)
    const { salt } = await storage.generateCryptoKey("p@ss");
    await storage.deriveCryptoKey({ password: "p@ss", salt });
    const key = await storage.getCryptoKey();
    expect(typeof key).toBe("string");
    expect((key as string).length).toBeGreaterThan(0);
  });

  test("getCryptoKey returns undefined when not set", async () => {
    expect(await storage.getCryptoKey()).toBeUndefined();
  });

  test("generateCryptoKey returns a key with salt", async () => {
    const key = await storage.generateCryptoKey("password");
    expect(key.password).toBe("password");
    expect(typeof key.salt).toBe("string");
    expect((key.salt as string).length).toBeGreaterThan(0);
  });

  test("generateCryptoKey uses provided salt", async () => {
    const key = await storage.generateCryptoKey("password", "mysalt");
    expect(key.salt).toBe("mysalt");
  });

  test("generateCryptoKeyPair returns a key pair", async () => {
    const kp = await storage.generateCryptoKeyPair();
    expect(kp).toBeDefined();
    expect(kp.publicKey).toBeDefined();
    expect(kp.privateKey).toBeDefined();
  });

  test("hash produces consistent output for same inputs", async () => {
    const h1 = await storage.hash("password", "user@example.com");
    const h2 = await storage.hash("password", "user@example.com");
    expect(h1).toBe(h2);
  });

  test("hash produces different output for different passwords", async () => {
    const h1 = await storage.hash("password1", "user@example.com");
    const h2 = await storage.hash("password2", "user@example.com");
    expect(h1).not.toBe(h2);
  });
});
