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

import Storage from "./storage";

export default class Indexer extends Storage {
  constructor(storage, type) {
    super(storage);
    this.type = type;
    this.indices = [];
  }

  async init() {
    this.indices = (await super.read(this.type, true)) || [];
  }

  exists(key) {
    return this.indices.includes(key);
  }

  async index(key) {
    if (this.exists(key)) return;
    this.indices.push(key);
    await super.write(this.type, this.indices);
  }

  getIndices() {
    return this.indices;
  }

  async deindex(key) {
    if (!this.exists(key)) return;
    this.indices.splice(this.indices.indexOf(key), 1);
    await super.write(this.type, this.indices);
  }

  async clear() {
    this.indices = [];
    await super.clear();
  }

  read(key, isArray = false) {
    if (!this.exists(key)) return;
    return super.read(this.makeId(key), isArray);
  }

  write(key, data) {
    return super.write(this.makeId(key), data);
  }

  remove(key) {
    return super.remove(this.makeId(key));
  }

  async readMulti(keys) {
    const entries = await super.readMulti(
      keys.filter(this.exists, this).map(this.makeId, this)
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
  async writeMulti(items) {
    const entries = items.map(([id, item]) => {
      if (!this.indices.includes(id)) this.indices.push(id);
      return [this.makeId(id), item];
    });
    entries.push([this.type, this.indices]);
    await super.writeMulti(entries);
  }

  async migrateIndices() {
    const keys = (await super.getAllKeys()).filter(
      (key) => !key.endsWith(`_${this.type}`) && this.exists(key)
    );
    for (const id of keys) {
      const item = await super.read(id);
      if (!item) continue;

      await this.write(id, item);
    }

    // remove old ids once they have been moved
    for (const id of keys) {
      await super.remove(id);
    }
  }

  makeId = (id) => {
    return `${id}_${this.type}`;
  };
}
