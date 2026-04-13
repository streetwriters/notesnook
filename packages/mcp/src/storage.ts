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

import {
  AsymmetricCipher,
  Cipher,
  NNCrypto,
  SerializedKey,
  SerializedKeyPair
} from "@notesnook/crypto";
import type { IStorage } from "@notesnook/core";
import type { Database as BetterSQLite3Database } from "better-sqlite3-multiple-ciphers";

/**
 * IStorage implementation backed by a SQLite key-value table.
 * Crypto operations delegate to NNCrypto (same as the Node.js test mock).
 */
export class NodeStorageInterface implements IStorage {
  private readonly crypto = new NNCrypto();

  constructor(private readonly db: BetterSQLite3Database) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS mcp_kv (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      ) WITHOUT ROWID;
    `);
  }

  async write<T>(key: string, data: T): Promise<void> {
    this.db
      .prepare(`INSERT OR REPLACE INTO mcp_kv (key, value) VALUES (?, ?)`)
      .run(key, JSON.stringify(data));
  }

  async writeMulti<T>(entries: [string, T][]): Promise<void> {
    const stmt = this.db.prepare(
      `INSERT OR REPLACE INTO mcp_kv (key, value) VALUES (?, ?)`
    );
    const insertMany = this.db.transaction((rows: [string, T][]) => {
      for (const [k, v] of rows) stmt.run(k, JSON.stringify(v));
    });
    insertMany(entries);
  }

  async read<T>(key: string): Promise<T | undefined> {
    const row = this.db
      .prepare<[string], { value: string }>(
        `SELECT value FROM mcp_kv WHERE key = ?`
      )
      .get(key);
    if (row === undefined) return undefined;
    return JSON.parse(row.value) as T;
  }

  async readMulti<T>(keys: string[]): Promise<[string, T][]> {
    if (keys.length === 0) return [];
    const placeholders = keys.map(() => "?").join(",");
    const rows = this.db
      .prepare<string[], { key: string; value: string }>(
        `SELECT key, value FROM mcp_kv WHERE key IN (${placeholders})`
      )
      .all(...keys);
    return rows.map((r) => [r.key, JSON.parse(r.value) as T]);
  }

  async remove(key: string): Promise<void> {
    this.db.prepare(`DELETE FROM mcp_kv WHERE key = ?`).run(key);
  }

  async removeMulti(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    const placeholders = keys.map(() => "?").join(",");
    this.db
      .prepare(`DELETE FROM mcp_kv WHERE key IN (${placeholders})`)
      .run(...keys);
  }

  async clear(): Promise<void> {
    this.db.prepare(`DELETE FROM mcp_kv`).run();
  }

  async getAllKeys(): Promise<string[]> {
    const rows = this.db
      .prepare<[], { key: string }>(`SELECT key FROM mcp_kv`)
      .all();
    return rows.map((r) => r.key);
  }

  // ── Crypto (delegates to NNCrypto, same approach as NodeStorageInterface mock) ──

  async encrypt(
    key: SerializedKey,
    plainText: string
  ): Promise<Cipher<"base64">> {
    return this.crypto.encrypt(key, plainText, "text", "base64");
  }

  async encryptMulti(
    key: SerializedKey,
    items: string[]
  ): Promise<Cipher<"base64">[]> {
    return this.crypto.encryptMulti(key, items, "text", "base64");
  }

  async decrypt(
    key: SerializedKey,
    cipherData: Cipher<"base64">
  ): Promise<string> {
    cipherData.format = "base64";
    return this.crypto.decrypt(key, cipherData, "text");
  }

  async decryptMulti(
    key: SerializedKey,
    items: Cipher<"base64">[]
  ): Promise<string[]> {
    items.forEach((c) => (c.format = "base64"));
    return this.crypto.decryptMulti(key, items, "text");
  }

  async decryptAsymmetric(
    keyPair: SerializedKeyPair,
    cipherData: AsymmetricCipher<"base64">
  ): Promise<string> {
    return this.crypto.decryptAsymmetric(keyPair, cipherData, "text");
  }

  async deriveCryptoKey(credentials: SerializedKey): Promise<void> {
    const { password, salt } = credentials;
    if (!password || !salt) return;
    const keyData = await this.crypto.exportKey(password, salt);
    await this.write("userEncryptionKey", keyData.key);
  }

  async getCryptoKey(): Promise<string | undefined> {
    return this.read<string>("userEncryptionKey");
  }

  async hash(
    password: string,
    email: string,
    _options?: { usesFallback?: boolean }
  ): Promise<string> {
    const APP_SALT = "oVzKtazBo7d8sb7TBvY9jw";
    return this.crypto.hash(password, `${APP_SALT}${email}`);
  }

  async generateCryptoKey(
    password: string,
    salt?: string
  ): Promise<SerializedKey> {
    const { randomBytes } = await import("crypto");
    return { password, salt: salt ?? randomBytes(16).toString("base64") };
  }

  async generateCryptoKeyPair(): Promise<SerializedKeyPair> {
    return this.crypto.exportKeyPair();
  }

  async generateCryptoKeyFallback(
    password: string,
    salt?: string
  ): Promise<SerializedKey> {
    return this.generateCryptoKey(password, salt);
  }

  async deriveCryptoKeyFallback(credentials: SerializedKey): Promise<void> {
    return this.deriveCryptoKey(credentials);
  }
}
