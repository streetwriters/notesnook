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
import { MMKVInstance } from "react-native-mmkv-storage";
import {
  decrypt,
  decryptMulti,
  deriveCryptoKey,
  deriveCryptoKeyFallback,
  encrypt,
  encryptMulti,
  generateCryptoKey,
  getCryptoKey,
  hash,
  generateCryptoKeyFallback
} from "./encryption";
import { MMKV } from "./mmkv";

export class KV {
  storage: MMKVInstance;
  constructor(storage: MMKVInstance) {
    this.storage = storage;
  }

  async read<T>(key: string, isArray?: boolean) {
    if (!key) return undefined;
    const data = this.storage.getString(key);
    if (!data) return undefined;
    try {
      return JSON.parse(data) as T;
    } catch (e) {
      return data as T;
    }
  }

  async write<T>(key: string, data: T) {
    this.storage.setString(
      key,
      typeof data === "string" ? data : JSON.stringify(data)
    );
  }

  async readMulti<T>(keys: string[]) {
    if (keys.length <= 0) {
      return [];
    } else {
      try {
        const data = await this.storage.getMultipleItemsAsync<any>(
          keys.slice(),
          "string"
        );
        return data.map(([key, value]) => {
          let obj;
          try {
            obj = JSON.parse(value);
          } catch (e) {
            obj = value;
          }
          return [key, obj];
        }) as [string, T][];
      } catch (e) {
        return [];
      }
    }
  }

  async remove(key: string) {
    this.storage.removeItem(key);
  }

  async removeMulti(keys: string[]) {
    if (!keys) return;
    this.storage.removeItems(keys);
  }

  async clear() {
    this.storage.clearStore();
  }

  async getAllKeys() {
    let keys = (await this.storage.indexer.getKeys()) || [];
    keys = keys.filter(
      (k) =>
        k !== "stringIndex" &&
        k !== "boolIndex" &&
        k !== "mapIndex" &&
        k !== "arrayIndex" &&
        k !== "numberIndex" &&
        k !== this.storage.instanceID
    );
    return keys;
  }

  async writeMulti(items: [string, any][]) {
    await this.storage.setMultipleItemsAsync(items, "object");
  }
}

const DefaultStorage = new KV(MMKV);

export const Storage: IStorage = {
  write<T>(key: string, data: T): Promise<void> {
    return DefaultStorage.write(key, data);
  },
  writeMulti<T>(entries: [string, T][]): Promise<void> {
    return DefaultStorage.writeMulti(entries);
  },
  readMulti<T>(keys: string[]): Promise<[string, T][]> {
    return DefaultStorage.readMulti(keys);
  },
  read<T>(key: string, isArray?: boolean): Promise<T | undefined> {
    return DefaultStorage.read(key, isArray);
  },
  remove(key: string): Promise<void> {
    return DefaultStorage.remove(key);
  },
  removeMulti(keys: string[]): Promise<void> {
    return DefaultStorage.removeMulti(keys);
  },
  clear(): Promise<void> {
    return DefaultStorage.clear();
  },
  getAllKeys(): Promise<string[]> {
    return DefaultStorage.getAllKeys();
  },
  hash,
  getCryptoKey,
  encrypt,
  encryptMulti,
  decrypt,
  decryptMulti,
  deriveCryptoKey,
  generateCryptoKey,
  generateCryptoKeyFallback,
  deriveCryptoKeyFallback
};
