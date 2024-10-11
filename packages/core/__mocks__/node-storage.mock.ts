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

import { Cipher, NNCrypto, SerializedKey } from "@notesnook/crypto";
import { IStorage } from "../src/interfaces.js";

export class NodeStorageInterface implements IStorage {
  storage = {};
  crypto = new NNCrypto();

  async removeMulti(keys: string[]): Promise<void> {
    for (const key of keys) {
      this.remove(key);
    }
  }

  async write<T>(key: string, data: T): Promise<void> {
    this.storage[key] = data;
  }

  async writeMulti<T>(entries: [key: string, data: T][]) {
    for (const [key, value] of entries) {
      this.storage[key] = value;
    }
  }

  async readMulti<T>(keys: string[]): Promise<[string, T][]> {
    const result: [string, T][] = [];
    keys.forEach((key) => {
      result.push([key, this.storage[key]]);
    });
    return result;
  }

  async read<T>(
    key: string,
    isArray?: boolean | undefined
  ): Promise<T | undefined> {
    return this.storage[key];
  }

  async remove(key: string): Promise<void> {
    delete this.storage[key];
  }

  async clear(): Promise<void> {
    this.storage = {};
  }

  async getAllKeys(): Promise<string[]> {
    return Object.keys(this.storage);
  }

  async encrypt(key: SerializedKey, plainText: string) {
    return await this.crypto.encrypt(key, plainText, "text", "base64");
  }

  async encryptMulti(key: SerializedKey, items: string[]) {
    return await this.crypto.encryptMulti(key, items, "text", "base64");
  }

  decrypt(key: SerializedKey, cipherData: Cipher<"base64">): Promise<string> {
    cipherData.format = "base64";
    return this.crypto.decrypt(key, cipherData, "text");
  }

  decryptMulti(key: SerializedKey, items: Cipher<"base64">[]) {
    items.forEach((c) => (c.format = "base64"));
    return this.crypto.decryptMulti(key, items, "text");
  }

  async deriveCryptoKey(credentials: SerializedKey): Promise<void> {
    const { password, salt } = credentials;
    if (!password || !salt) return;
    const keyData = await this.crypto.exportKey(password, salt);
    await this.write(`userEncryptionKey`, keyData.key);
  }

  async hash(password: string, email: string): Promise<string> {
    const APP_SALT = "oVzKtazBo7d8sb7TBvY9jw";
    return await this.crypto.hash(password, `${APP_SALT}${email}`);
  }

  async getCryptoKey(): Promise<string | undefined> {
    const key = await this.read<string>(`userEncryptionKey`);
    if (!key) return;
    return key;
  }

  async generateCryptoKey(
    password: string,
    salt?: string | undefined
  ): Promise<SerializedKey> {
    return { password, salt };
  }
}
