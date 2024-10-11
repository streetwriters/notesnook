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

import { StorageAccessor } from "../interfaces.js";
import { MaybeDeletedItem } from "../types.js";

export default class Indexer<T> {
  private _indices: string[] = [];
  constructor(
    private readonly storage: StorageAccessor,
    private readonly type: string
  ) {}

  async init() {
    this._indices = (await this.storage().read(this.type, true)) || [];
  }

  exists(key: string) {
    return this.indices.includes(key);
  }

  async index(key: string) {
    if (this.exists(key)) return;
    this.indices.push(key);
    await this.storage().write(this.type, this.indices);
  }

  get indices() {
    return this._indices;
  }

  async deindex(key: string) {
    if (!this.exists(key)) return;
    this.indices.splice(this.indices.indexOf(key), 1);
    await this.storage().write(this.type, this.indices);
  }

  async clear() {
    await this.storage().removeMulti(
      this._indices.map((key) => this.makeId(key))
    );
    this._indices = [];
    await this.storage().write(this.type, this._indices);
  }

  async read(
    key: string,
    isArray = false
  ): Promise<MaybeDeletedItem<T> | undefined> {
    return await this.storage().read(this.makeId(key), isArray);
  }

  write(key: string, data: MaybeDeletedItem<T>) {
    return this.storage().write(this.makeId(key), data);
  }

  remove(key: string) {
    return this.storage().remove(this.makeId(key));
  }

  async readMulti(keys: string[]) {
    const entries = await this.storage().readMulti<MaybeDeletedItem<T>>(
      keys.map(this.makeId, this)
    );
    entries.forEach((entry) => {
      entry[0] = entry[0].replace(`_${this.type}`, "");
    });
    return entries;
  }

  /**
   *
   * @param {any[]} items
   * @returns
   */
  async writeMulti(items: [string, MaybeDeletedItem<T>][]) {
    const entries: [string, MaybeDeletedItem<T> | string[]][] = items.map(
      ([id, item]) => {
        if (!this.indices.includes(id)) this.indices.push(id);
        return [this.makeId(id), item];
      }
    );
    entries.push([this.type, this.indices]);
    await this.storage().writeMulti(entries);
  }

  async migrateIndices() {
    const keys = (await this.storage().getAllKeys()).filter(
      (key) => !key.endsWith(`_${this.type}`) && this.exists(key)
    );
    for (const id of keys) {
      const item = await this.storage().read<T>(id);
      if (!item) continue;

      await this.write(id, item);
    }

    // remove old ids once they have been moved
    for (const id of keys) {
      await this.storage().remove(id);
    }
  }

  private makeId(id: string) {
    return `${id}_${this.type}`;
  }
}
