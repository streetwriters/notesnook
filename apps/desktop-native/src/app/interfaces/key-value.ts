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

import type { KVStore } from "@platform";

export interface IKVStore {
  get<T>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown): Promise<void>;
  setMany(entries: [string, unknown][]): Promise<void>;
  delete(key: string): Promise<void>;
  deleteMany(keys: string[]): Promise<void>;
  entries<T>(): Promise<[string, T][]>;
  clear(): Promise<void>;
}

export class PlatformKVStore implements IKVStore {
  constructor(private readonly store: KVStore) {}

  get<T>(key: string) {
    return this.store.get<T>(key);
  }

  set(key: string, value: unknown) {
    return this.store.set(key, value);
  }

  async setMany(entries: [string, unknown][]) {
    for (const [key, value] of entries) await this.store.set(key, value);
  }

  delete(key: string) {
    return this.store.delete(key);
  }

  async deleteMany(keys: string[]) {
    for (const key of keys) await this.store.delete(key);
  }

  async entries<T>() {
    const result: [string, T][] = [];
    for (const key of await this.store.keys()) {
      const value = await this.store.get<T>(key);
      if (value !== undefined) result.push([key, value]);
    }
    return result;
  }

  async clear() {
    await this.deleteMany(await this.store.keys());
  }
}

export class MemoryKVStore implements IKVStore {
  private readonly map = new Map<string, unknown>();

  async get<T>(key: string) {
    return this.map.get(key) as T | undefined;
  }

  async set(key: string, value: unknown) {
    this.map.set(key, value);
  }

  async setMany(entries: [string, unknown][]) {
    for (const [key, value] of entries) this.map.set(key, value);
  }

  async delete(key: string) {
    this.map.delete(key);
  }

  async deleteMany(keys: string[]) {
    for (const key of keys) this.map.delete(key);
  }

  async entries<T>() {
    return [...this.map.entries()] as [string, T][];
  }

  async clear() {
    this.map.clear();
  }
}
