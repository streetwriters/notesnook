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

import type { KVStore, KVStoreFactory } from "../../../platform";
import { decode, encode } from "../../../shared/kv-codec";

export const kvStore: KVStoreFactory = {
  create(name): KVStore {
    const prefix = `kv:${name}:`;
    return {
      async get<T>(key: string) {
        const text = localStorage.getItem(prefix + key);
        return text ? decode<T>(text) : undefined;
      },
      async set(key, value) {
        localStorage.setItem(prefix + key, encode(value));
      },
      async delete(key) {
        localStorage.removeItem(prefix + key);
      },
      async keys() {
        return Object.keys(localStorage)
          .filter((key) => key.startsWith(prefix))
          .map((key) => key.slice(prefix.length));
      }
    };
  }
};
