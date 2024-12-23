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

import { IStorage } from "@notesnook/core";
import {
  IndexedDBKVStore,
  LocalStorageKVStore,
  MemoryKVStore,
  IKVStore
} from "./key-value";
import { NNCrypto } from "./nncrypto";
import type { Cipher, SerializedKey } from "@notesnook/crypto";
import { isFeatureSupported } from "../utils/feature-check";
import { IKeyStore } from "./key-store";
import { User } from "@notesnook/core";

type EncryptedKey = { iv: Uint8Array; cipher: BufferSource };
export type DatabasePersistence = "memory" | "db";

const APP_SALT = "oVzKtazBo7d8sb7TBvY9jw";

export class NNStorage implements IStorage {
  database: IKVStore;

  constructor(
    name: string,
    private readonly keyStore: () => IKeyStore | null = () => null,
    persistence: DatabasePersistence = "db"
  ) {
    this.database =
      persistence === "memory"
        ? new MemoryKVStore()
        : isFeatureSupported("indexedDB")
        ? new IndexedDBKVStore(name, "keyvaluepairs")
        : new LocalStorageKVStore();
  }

  async migrate() {
    if (!this.keyStore) return;
    const user = await this.read<User>("user");
    if (!user) return;

    const key = await this._getCryptoKey(`_uk_@${user.email}`);
    if (!key) return;

    await this.database.deleteMany([
      `_uk_@${user.email}`,
      `_uk_@${user.email}@_k`
    ]);
    await this.keyStore()?.setValue("userEncryptionKey", key);
  }

  read<T>(key: string): Promise<T | undefined> {
    if (!key) return Promise.resolve(undefined);
    return this.database.get(key);
  }

  readMulti<T>(keys: string[]): Promise<[string, T][]> {
    if (keys.length <= 0) return Promise.resolve([]);
    return this.database.getMany(keys.sort());
  }

  writeMulti<T>(entries: [string, T][]) {
    return this.database.setMany(entries);
  }

  write<T>(key: string, data: T) {
    return this.database.set(key, data);
  }

  remove(key: string) {
    return this.database.delete(key);
  }

  removeMulti(keys: string[]) {
    return this.database.deleteMany(keys);
  }

  clear() {
    return this.database.clear();
  }

  getAllKeys() {
    return this.database.keys();
  }

  async deriveCryptoKey(credentials: SerializedKey) {
    if (!this.keyStore) throw new Error("No key store found!");

    const { password, salt } = credentials;
    if (!password) throw new Error("Invalid data provided to deriveCryptoKey.");

    const keyData = await NNCrypto.exportKey(password, salt);
    if (!keyData.key) throw new Error("Invalid key.");

    await this.keyStore()?.setValue("userEncryptionKey", keyData.key);
  }

  async getCryptoKey(): Promise<string | undefined> {
    if (!this.keyStore) throw new Error("No key store found!");

    return this.keyStore()?.getValue("userEncryptionKey");
  }

  async generateCryptoKey(
    password: string,
    salt?: string
  ): Promise<SerializedKey> {
    if (!password)
      throw new Error("Invalid data provided to generateCryptoKey.");

    return await NNCrypto.exportKey(password, salt);
  }

  async hash(password: string, email: string): Promise<string> {
    return await NNCrypto.hash(password, `${APP_SALT}${email}`);
  }

  encrypt(key: SerializedKey, plainText: string): Promise<Cipher<"base64">> {
    return NNCrypto.encrypt(key, plainText, "text", "base64");
  }

  encryptMulti(
    key: SerializedKey,
    items: string[]
  ): Promise<Cipher<"base64">[]> {
    return NNCrypto.encryptMulti(key, items, "text", "base64");
  }

  decrypt(key: SerializedKey, cipherData: Cipher<"base64">): Promise<string> {
    cipherData.format = "base64";
    return NNCrypto.decrypt(key, cipherData, "text");
  }

  decryptMulti(
    key: SerializedKey,
    items: Cipher<"base64">[]
  ): Promise<string[]> {
    items.forEach((c) => (c.format = "base64"));
    return NNCrypto.decryptMulti(key, items, "text");
  }

  /**
   * @deprecated
   */
  private async _getCryptoKey(name: string) {
    if (isFeatureSupported("indexedDB") && window?.crypto?.subtle) {
      const pbkdfKey = await this.read<CryptoKey>(name);
      const cipheredKey = await this.read<EncryptedKey | string>(`${name}@_k`);
      if (typeof cipheredKey === "string") return cipheredKey;
      if (!pbkdfKey || !cipheredKey) return;
      return await aesDecrypt(pbkdfKey, cipheredKey);
    } else {
      const key = await this.read<string>(`${name}@_k`);
      if (!key) return;
      return key;
    }
  }

  // noop
  generateCryptoKeyFallback(
    password: string,
    salt?: string
  ): Promise<SerializedKey> {
    return this.generateCryptoKey(password, salt);
  }

  // noop
  async deriveCryptoKeyFallback(): Promise<void> {}
}

const dec = new TextDecoder();
async function aesDecrypt(
  cryptoKey: CryptoKey,
  data: EncryptedKey
): Promise<string> {
  const { iv, cipher } = data;

  const plainText = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    cryptoKey,
    cipher
  );
  return dec.decode(plainText);
}
