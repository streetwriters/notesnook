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

import { NNCrypto } from "@notesnook/crypto";
import { Cipher, SerializedKey } from "@notesnook/crypto/dist/src/types";
import { Memento, SecretStorage } from "vscode";

const APP_SALT = "oVzKtazBo7d8sb7TBvY9jw";
export class Storage {
  private crypto: NNCrypto;
  constructor(private storage: Memento, private secrets: SecretStorage) {
    this.crypto = new NNCrypto();
  }

  async read(key: string) {
    return this.storage.get(key);
  }

  async readMulti(keys: string[]) {
    const result = [];
    keys.forEach((key) => {
      result.push([key, this.storage.get(key)]);
    });
    return result;
  }

  write(key: string, data: unknown) {
    return this.storage.update(key, data);
  }

  remove(key: string) {
    return this.storage.update(key, undefined);
  }

  clear() {
    return Promise.all(
      this.storage.keys().map((key) => this.storage.update(key, undefined))
    );
  }

  getAllKeys() {
    return this.storage.keys();
  }

  async encrypt(key: SerializedKey, plainText: string): Promise<Cipher> {
    return await this.crypto.encrypt(
      key,
      { format: "text", data: plainText },
      "base64"
    );
  }

  async decrypt(
    key: SerializedKey,
    cipherData: Cipher
  ): Promise<string | undefined> {
    cipherData.format = "base64";
    const result = await this.crypto.decrypt(key, cipherData);
    if (typeof result.data === "string") {
      return result.data;
    }
  }

  async deriveCryptoKey(name: string, credentials: SerializedKey) {
    const { password, salt } = credentials;
    if (!password) throw new Error("Invalid data provided to deriveCryptoKey.");

    const keyData = await this.crypto.exportKey(password, salt);
    if (keyData.key) {
      await this.secrets.store(`${name}@_k`, keyData.key);
    } else {
      throw new Error(`Invalid key.`);
    }
  }

  async getCryptoKey(name: string): Promise<string | undefined> {
    const key = await this.secrets.get(`${name}@_k`);
    if (!key) return;
    return key;
  }

  async hash(password: string, email: string): Promise<string> {
    return await this.crypto.hash(password, `${APP_SALT}${email}`);
  }

  async generateCryptoKey(
    password: string,
    salt?: string
  ): Promise<SerializedKey> {
    if (!password)
      throw new Error("Invalid data provided to generateCryptoKey.");
    return await this.crypto.exportKey(password, salt);
  }
}
