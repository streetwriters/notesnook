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

function encode(value: unknown) {
  return JSON.stringify(value, (_key, item) =>
    item instanceof Uint8Array ? { __u8: Array.from(item) } : item
  );
}

function decode<T>(text: string): T {
  return JSON.parse(text, (_key, item) =>
    item && typeof item === "object" && Array.isArray(item.__u8)
      ? new Uint8Array(item.__u8)
      : item
  );
}

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
