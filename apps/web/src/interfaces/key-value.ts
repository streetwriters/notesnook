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

import Config from "../utils/config";

export interface IKVStore {
  /**
   * Get a value by its key.
   *
   * @param key
   */
  get<T>(key: string): Promise<T | undefined>;

  /**
   * Set a value with a key.
   *
   * @param key
   * @param value
   */
  set<T>(key: string, value: T): Promise<void>;

  /**
   * Set multiple values at once. This is faster than calling set() multiple times.
   * It's also atomic – if one of the pairs can't be added, none will be added.
   *
   * @param entries Array of entries, where each entry is an array of `[key, value]`.
   */
  setMany(entries: [string, unknown][]): Promise<void>;

  /**
   * Get multiple values by their keys
   *
   * @param keys
   */
  getMany<T>(keys: string[]): Promise<[string, T][]>;

  /**
   * Delete a particular key from the store.
   *
   * @param key
   */
  delete(key: string): Promise<void>;

  /**
   * Delete multiple keys at once.
   *
   * @param keys List of keys to delete.
   */
  deleteMany(keys: string[]): Promise<void>;

  /**
   * Clear all values in the store.
   *
   */
  clear(): Promise<void>;

  keys(): Promise<string[]>;
  values<T>(): Promise<T[]>;
  entries<T>(): Promise<[string, T][]>;
}

export class LocalStorageKVStore implements IKVStore {
  get<T>(key: string): Promise<T | undefined> {
    return Promise.resolve(Config.get(key));
  }
  set(key: string, value: any): Promise<void> {
    return Promise.resolve(Config.set(key, value));
  }
  setMany(entries: [string, any][]): Promise<void> {
    for (const entry of entries) {
      Config.set(entry[0], entry[1]);
    }
    return Promise.resolve();
  }
  getMany<T>(keys: string[]): Promise<[string, T][]> {
    const entries: [string, T][] = [];
    for (const key of keys) {
      entries.push([key, Config.get(key)]);
    }
    return Promise.resolve(entries);
  }
  delete(key: string): Promise<void> {
    return Promise.resolve(Config.remove(key));
  }
  deleteMany(keys: string[]): Promise<void> {
    for (const key of keys) {
      Config.remove(key);
    }
    return Promise.resolve();
  }
  clear(): Promise<void> {
    Config.clear();
    return Promise.resolve();
  }
  keys(): Promise<string[]> {
    return Promise.resolve(Object.keys(Config.all()));
  }
  values<T>(): Promise<T[]> {
    return Promise.resolve(Object.values<T>(Config.all()));
  }
  entries<T>(): Promise<[string, T][]> {
    return Promise.resolve(Object.entries<T>(Config.all()));
  }
}

export class MemoryKVStore implements IKVStore {
  private storage: Record<string, any> = {};
  get<T>(key: string): Promise<T | undefined> {
    return Promise.resolve(this.storage[key]);
  }
  set(key: string, value: any): Promise<void> {
    this.storage[key] = value;
    return Promise.resolve();
  }
  setMany(entries: [string, any][]): Promise<void> {
    for (const entry of entries) {
      this.storage[entry[0]] = entry[1];
    }
    return Promise.resolve();
  }
  getMany<T>(keys: string[]): Promise<[string, T][]> {
    const entries: [string, T][] = [];
    for (const key of keys) {
      entries.push([key, this.storage[key]]);
    }
    return Promise.resolve(entries);
  }
  delete(key: string): Promise<void> {
    delete this.storage[key];
    return Promise.resolve();
  }
  deleteMany(keys: string[]): Promise<void> {
    for (const key of keys) {
      delete this.storage[key];
    }
    return Promise.resolve();
  }
  clear(): Promise<void> {
    this.storage = {};
    return Promise.resolve();
  }
  keys(): Promise<string[]> {
    return Promise.resolve(Object.keys(this.storage));
  }
  values<T>(): Promise<T[]> {
    return Promise.resolve(Object.values<T>(this.storage));
  }
  entries<T>(): Promise<[string, T][]> {
    return Promise.resolve(Object.entries<T>(this.storage));
  }
}

export type UseStore = <T>(
  txMode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => T | PromiseLike<T>
) => Promise<T>;

export class IndexedDBKVStore implements IKVStore {
  store: UseStore;

  constructor(databaseName: string, storeName: string) {
    this.store = this.createStore(databaseName, storeName);
  }

  private createStore(dbName: string, storeName: string): UseStore {
    const request = indexedDB.open(dbName);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName);
    const dbp = promisifyIDBRequest(request);

    return (txMode, callback) =>
      dbp.then((db) =>
        callback(db.transaction(storeName, txMode).objectStore(storeName))
      );
  }

  private eachCursor(
    store: IDBObjectStore,
    callback: (cursor: IDBCursorWithValue) => void
  ): Promise<void> {
    store.openCursor().onsuccess = function () {
      if (!this.result) return;
      callback(this.result);
      this.result.continue();
    };
    return promisifyIDBRequest(store.transaction);
  }

  get<T>(key: string): Promise<T | undefined> {
    return this.store("readonly", (store) =>
      promisifyIDBRequest(store.get(key))
    );
  }

  set(key: string, value: any): Promise<void> {
    return this.store("readwrite", (store) => {
      store.put(value, key);
      return promisifyIDBRequest(store.transaction);
    });
  }

  setMany(entries: [string, any][]): Promise<void> {
    return this.store("readwrite", (store) => {
      entries.forEach((entry) => store.put(entry[1], entry[0]));
      return promisifyIDBRequest(store.transaction);
    });
  }

  getMany<T>(keys: string[]): Promise<[string, T][]> {
    return this.store("readonly", (store) =>
      Promise.all(
        keys.map(async (key) => [
          key,
          await promisifyIDBRequest(store.get(key))
        ])
      )
    );
  }

  delete(key: string): Promise<void> {
    return this.store("readwrite", (store) => {
      store.delete(key);
      return promisifyIDBRequest(store.transaction);
    });
  }

  deleteMany(keys: string[]): Promise<void> {
    return this.store("readwrite", (store: IDBObjectStore) => {
      keys.forEach((key: IDBValidKey) => store.delete(key));
      return promisifyIDBRequest(store.transaction);
    });
  }

  clear(): Promise<void> {
    return this.store("readwrite", (store) => {
      store.clear();
      return promisifyIDBRequest(store.transaction);
    });
  }

  keys<KeyType extends IDBValidKey>(): Promise<KeyType[]> {
    return this.store("readonly", (store) => {
      // Fast path for modern browsers
      if (store.getAllKeys) {
        return promisifyIDBRequest(
          store.getAllKeys() as unknown as IDBRequest<KeyType[]>
        );
      }

      const items: KeyType[] = [];

      return this.eachCursor(store, (cursor) =>
        items.push(cursor.key as KeyType)
      ).then(() => items);
    });
  }

  values<T = any>(): Promise<T[]> {
    return this.store("readonly", (store) => {
      // Fast path for modern browsers
      if (store.getAll) {
        return promisifyIDBRequest(store.getAll() as IDBRequest<T[]>);
      }

      const items: T[] = [];

      return this.eachCursor(store, (cursor) =>
        items.push(cursor.value as T)
      ).then(() => items);
    });
  }

  entries<KeyType extends IDBValidKey, ValueType = any>(): Promise<
    [KeyType, ValueType][]
  > {
    return this.store("readonly", (store) => {
      // Fast path for modern browsers
      // (although, hopefully we'll get a simpler path some day)
      if (store.getAll && store.getAllKeys) {
        return Promise.all([
          promisifyIDBRequest(
            store.getAllKeys() as unknown as IDBRequest<KeyType[]>
          ),
          promisifyIDBRequest(store.getAll() as IDBRequest<ValueType[]>)
        ]).then(([keys, values]) => keys.map((key, i) => [key, values[i]]));
      }

      const items: [KeyType, ValueType][] = [];

      return this.store("readonly", (store) =>
        this.eachCursor(store, (cursor) =>
          items.push([cursor.key as KeyType, cursor.value])
        ).then(() => items)
      );
    });
  }
}

function promisifyIDBRequest<T = undefined>(
  request: IDBRequest<T> | IDBTransaction
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - file size hacks
    request.oncomplete = request.onsuccess = () => resolve(request.result);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - file size hacks
    request.onabort = request.onerror = () => reject(request.error);
  });
}
