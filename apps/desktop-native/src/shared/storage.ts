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

export type StorageKV = Pick<
  IStorage,
  | "write"
  | "writeMulti"
  | "read"
  | "readMulti"
  | "remove"
  | "removeMulti"
  | "clear"
  | "getAllKeys"
>;

export type StorageCrypto = Pick<
  IStorage,
  | "hash"
  | "getCryptoKey"
  | "encrypt"
  | "encryptMulti"
  | "decrypt"
  | "decryptMulti"
  | "deriveCryptoKey"
  | "generateCryptoKey"
  | "generateCryptoKeyFallback"
  | "deriveCryptoKeyFallback"
>;

export type StoragePGP = Pick<
  IStorage,
  "generatePGPKeyPair" | "validatePGPKeyPair" | "decryptPGPMessage"
>;

export interface SyncKV {
  get<T>(key: string): T | undefined;
  set(key: string, value: unknown): void;
  delete(key: string): void;
  keys(): string[];
}

export function createStorageKV(kv: SyncKV): StorageKV {
  return {
    async write(key, data) {
      kv.set(key, data);
    },
    async writeMulti(entries) {
      for (const [key, value] of entries) kv.set(key, value);
    },
    async read<T>(key: string) {
      if (!key) return undefined;
      return kv.get<T>(key);
    },
    async readMulti<T>(keys: string[]) {
      return keys
        .slice()
        .sort()
        .map((key) => [key, kv.get<T>(key)] as [string, T]);
    },
    async remove(key) {
      kv.delete(key);
    },
    async removeMulti(keys) {
      keys.forEach((key) => kv.delete(key));
    },
    async clear() {
      kv.keys().forEach((key) => kv.delete(key));
    },
    async getAllKeys() {
      return kv.keys();
    }
  };
}

export function createStorage(
  kv: StorageKV,
  crypto: StorageCrypto,
  pgp: StoragePGP
): IStorage {
  return { ...kv, ...crypto, ...pgp };
}
