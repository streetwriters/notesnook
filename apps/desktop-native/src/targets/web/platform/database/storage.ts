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

import type { IStorage } from "@notesnook/core";
import {
  NNCrypto,
  type Cipher,
  type SerializedKey,
  type SerializedKeyPair
} from "@notesnook/crypto";
import { strings } from "@notesnook/intl";
import * as openpgp from "openpgp";
import type { DatabasePersistence } from "../../../../platform";
import {
  APP_SALT,
  USER_KEY,
  WEB_STORAGE_PREFIX
} from "../../../../shared/storage-constants";
import {
  createStorage as composeStorage,
  createStorageKV,
  type StorageCrypto,
  type StoragePGP,
  type SyncKV
} from "../../../../shared/storage";

const PREFIX = WEB_STORAGE_PREFIX;

const crypto = new NNCrypto();

function createLocalKV(): SyncKV {
  return {
    get<T>(key: string) {
      const text = localStorage.getItem(PREFIX + key);
      if (text === null) return undefined;
      try {
        return JSON.parse(text) as T;
      } catch {
        return text as unknown as T;
      }
    },
    set: (key, value) =>
      localStorage.setItem(PREFIX + key, JSON.stringify(value)),
    delete: (key) => localStorage.removeItem(PREFIX + key),
    keys: () =>
      Object.keys(localStorage)
        .filter((key) => key.startsWith(PREFIX))
        .map((key) => key.slice(PREFIX.length))
  };
}

function createMemoryKV(): SyncKV {
  const map = new Map<string, unknown>();
  return {
    get: <T>(key: string) => map.get(key) as T | undefined,
    set: (key, value) => void map.set(key, value),
    delete: (key) => void map.delete(key),
    keys: () => [...map.keys()]
  };
}

export function createStorage(persistence: DatabasePersistence): IStorage {
  const kv = persistence === "memory" ? createMemoryKV() : createLocalKV();

  const generateCryptoKey: StorageCrypto["generateCryptoKey"] = async (
    password,
    salt
  ) => {
    if (!password)
      throw new Error("Invalid data provided to generateCryptoKey.");
    return crypto.exportKey(password, salt);
  };

  const cryptoFunctions: StorageCrypto = {
    encrypt: (key: SerializedKey, plainText: string) =>
      crypto.encrypt(key, plainText, "text", "base64") as Promise<
        Cipher<"base64">
      >,
    encryptMulti: (key: SerializedKey, items: string[]) =>
      crypto.encryptMulti(key, items, "text", "base64") as Promise<
        Cipher<"base64">[]
      >,
    decrypt(key, cipher) {
      cipher.format = "base64";
      return crypto.decrypt(key, cipher, "text");
    },
    decryptMulti(key, items) {
      items.forEach((cipher) => (cipher.format = "base64"));
      return crypto.decryptMulti(key, items, "text");
    },
    async deriveCryptoKey(credentials) {
      const { password, salt } = credentials;
      if (!password)
        throw new Error("Invalid data provided to deriveCryptoKey.");
      const keyData = await crypto.exportKey(password, salt);
      if (!keyData.key) throw new Error("Invalid key.");
      kv.set(USER_KEY, keyData.key);
    },
    async getCryptoKey() {
      return kv.get<string>(USER_KEY);
    },
    generateCryptoKey,
    generateCryptoKeyFallback: generateCryptoKey,
    async deriveCryptoKeyFallback() {},
    hash: (password, email) => crypto.hash(password, `${APP_SALT}${email}`)
  };

  const pgp: StoragePGP = {
    async generatePGPKeyPair(): Promise<SerializedKeyPair> {
      const keys = await openpgp.generateKey({
        userIDs: [{ name: "NN", email: "NN@NN.NN" }]
      });
      return { publicKey: keys.publicKey, privateKey: keys.privateKey };
    },
    async validatePGPKeyPair(keys) {
      try {
        const privateKey = await openpgp.readPrivateKey({
          armoredKey: keys.privateKey
        });
        if (!privateKey.isDecrypted())
          return { isValid: false, message: strings.pgpPrivateKeyProtected() };

        const dummyData = JSON.stringify({
          favorite: true,
          title: "Hello world"
        });
        const publicKey = await openpgp.readKey({ armoredKey: keys.publicKey });
        const encrypted = await openpgp.encrypt({
          message: await openpgp.createMessage({ text: dummyData }),
          encryptionKeys: publicKey
        });
        const decrypted = await openpgp.decrypt({
          message: await openpgp.readMessage({ armoredMessage: encrypted }),
          decryptionKeys: privateKey
        });
        const isValid = decrypted.data === dummyData;
        return {
          isValid,
          message: isValid ? "" : strings.invalidPgpKeyPair()
        };
      } catch (e) {
        console.error("PGP key pair validation error:", e);
        return { isValid: false, message: strings.invalidPgpKeyPair() };
      }
    },
    async decryptPGPMessage(privateKeyArmored, encryptedMessage) {
      const decrypted = await openpgp.decrypt({
        message: await openpgp.readMessage({ armoredMessage: encryptedMessage }),
        decryptionKeys: await openpgp.readPrivateKey({
          armoredKey: privateKeyArmored
        })
      });
      return decrypted.data;
    }
  };

  return composeStorage(createStorageKV(kv), cryptoFunctions, pgp);
}
