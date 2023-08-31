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

export class NodeStorageInterface {
  constructor() {
    this.storage = {};
    this.crypto = new NNCrypto();
  }

  async read(key) {
    return new Promise((resolve) => resolve(this.storage[key]));
  }

  async readMulti(keys) {
    return new Promise((resolve) => {
      const result = [];
      keys.forEach((key) => {
        result.push([key, this.storage[key]]);
      });
      resolve(result);
    });
  }

  async write(key, data) {
    return new Promise((resolve) => resolve((this.storage[key] = data)));
  }
  remove(key) {
    delete this.storage[key];
  }
  clear() {
    this.storage = {};
  }
  getAllKeys() {
    return Object.keys(this.storage);
  }

  async encrypt(password, data) {
    return await this.crypto.encrypt(
      password,
      { format: "text", data },
      "base64"
    );
  }

  async decrypt(key, cipherData) {
    cipherData.format = "base64";
    return await this.crypto.decrypt(key, cipherData, "text");
  }

  async deriveCryptoKey(name, { password, salt }) {
    const keyData = await this.crypto.exportKey(password, salt);
    await this.write(`${name}@_k`, keyData.key);
  }

  async getCryptoKey(name) {
    const key = await this.read(`${name}@_k`);
    if (!key) return;
    return key;
  }

  async hash(password, email) {
    const APP_SALT = "oVzKtazBo7d8sb7TBvY9jw";
    return await this.crypto.hash(password, `${APP_SALT}${email}`);
  }

  async generateCryptoKey(password, salt) {
    return { password, salt };
  }
}
