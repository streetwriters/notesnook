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

import { MMKVLoader } from "react-native-mmkv-storage";
import type { KVStore, KVStoreFactory } from "../../../platform";
import { decode, encode } from "./kv-codec";

export const kvStore: KVStoreFactory = {
  create(name): KVStore {
    const storage = new MMKVLoader()
      .withInstanceID(`kv_${name}`)
      .disableIndexing()
      .initialize();
    const INDEX = "__keys";
    const index = () => {
      const text = storage.getString(INDEX);
      return text ? (JSON.parse(text) as string[]) : [];
    };
    return {
      async get<T>(key: string) {
        const text = storage.getString(key);
        return text ? decode<T>(text) : undefined;
      },
      async set(key, value) {
        storage.setString(key, encode(value));
        const keys = index();
        if (!keys.includes(key))
          storage.setString(INDEX, JSON.stringify([...keys, key]));
      },
      async delete(key) {
        storage.removeItem(key);
        storage.setString(
          INDEX,
          JSON.stringify(index().filter((item) => item !== key))
        );
      },
      async keys() {
        return index();
      }
    };
  }
};
