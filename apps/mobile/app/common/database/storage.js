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

import { Platform } from "react-native";
import RNFetchBlob from "react-native-blob-util";
import {
  decrypt,
  deriveCryptoKey,
  encrypt,
  generateCryptoKey,
  getCryptoKey,
  getRandomBytes,
  hash,
  removeCryptoKey
} from "./encryption";
import { MMKV } from "./mmkv";

export class KV {
  storage = null;
  constructor(storage) {
    this.storage = storage;
  }
  async read(key) {
    if (!key) return null;
    let data = this.storage.getString(key);
    if (!data) return null;
    try {
      let parse = JSON.parse(data);
      return parse;
    } catch (e) {
      return data;
    }
  }

  async write(key, data) {
    this.storage.setString(
      key,
      typeof data === "string" ? data : JSON.stringify(data)
    );
    return true;
  }

  async readMulti(keys) {
    if (keys.length <= 0) {
      return [];
    } else {
      let data = await this.storage.getMultipleItemsAsync(keys.slice());

      return data.map(([key, value]) => {
        let obj;
        try {
          obj = JSON.parse(value);
        } catch (e) {
          obj = value;
        }

        return [key, obj];
      });
    }
  }

  async remove(key) {
    return await this.storage.removeItem(key);
  }

  async clear() {
    return await this.storage.clearStore();
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
}

const DefaultStorage = new KV(MMKV);

async function requestPermission() {
  if (Platform.OS === "ios") return true;
  return true;
}
async function checkAndCreateDir(path) {
  let dir =
    Platform.OS === "ios"
      ? RNFetchBlob.fs.dirs.DocumentDir + path
      : RNFetchBlob.fs.dirs.SDCardDir + "/Notesnook/" + path;

  try {
    let exists = await RNFetchBlob.fs.exists(dir);
    let isDir = await RNFetchBlob.fs.isDir(dir);
    if (!exists || !isDir) {
      await RNFetchBlob.fs.mkdir(dir);
    }
  } catch (e) {
    await RNFetchBlob.fs.mkdir(dir);
  }
  return dir;
}

export default {
  read: (key) => DefaultStorage.read(key),
  write: (key, value) => DefaultStorage.write(key, value),
  readMulti: (keys) => DefaultStorage.readMulti(keys),
  remove: (key) => DefaultStorage.remove(key),
  clear: () => DefaultStorage.clear(),
  getAllKeys: () => DefaultStorage.getAllKeys(),
  encrypt,
  decrypt,
  getRandomBytes,
  checkAndCreateDir,
  requestPermission,
  deriveCryptoKey,
  getCryptoKey,
  removeCryptoKey,
  hash,
  generateCryptoKey
};
