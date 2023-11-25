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

import { randomBytes } from "../utils/random";

export default class Storage {
  constructor(storage) {
    this.storage = storage;
  }

  write(key, data) {
    return this.storage.write(key, data);
  }

  readMulti(keys) {
    return this.storage.readMulti(keys);
  }

  writeMulti(entries) {
    return this.storage.writeMulti(entries);
  }

  read(key, isArray = false) {
    return this.storage.read(key, isArray);
  }

  clear() {
    return this.storage.clear();
  }

  remove(key) {
    return this.storage.remove(key);
  }

  removeMulti(...keys) {
    return this.storage.removeMulti(...keys);
  }

  getAllKeys() {
    return this.storage.getAllKeys();
  }

  encrypt(password, data) {
    return this.storage.encrypt(password, data);
  }

  encryptMulti(password, data) {
    return this.storage.encryptMulti(password, data);
  }

  decrypt(password, cipher) {
    return this.storage.decrypt(password, cipher);
  }

  decryptMulti(password, items) {
    return this.storage.decryptMulti(password, items);
  }

  deriveCryptoKey(name, data) {
    return this.storage.deriveCryptoKey(name, data);
  }

  hash(password, userId) {
    return this.storage.hash(password, userId);
  }

  getCryptoKey(name) {
    return this.storage.getCryptoKey(name);
  }

  generateCryptoKey(password, salt) {
    return this.storage.generateCryptoKey(password, salt);
  }

  async generateRandomKey() {
    const passwordBytes = randomBytes(124);
    const password = passwordBytes.toString("base64");
    return await this.storage.generateCryptoKey(password);
  }
}
