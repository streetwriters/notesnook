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

import IndexedCollection from "./indexed-collection";
import MapStub from "../utils/map";

export default class CachedCollection extends IndexedCollection {
  constructor(context, type, eventManager) {
    super(context, type, eventManager);
    this.type = type;
    this.map = new Map();
    this.items = undefined;
    // this.eventManager = eventManager;
    // this.encryptionKeyFactory = encryptionKeyFactory;
  }

  async init() {
    await super.init();
    let data = await this.indexer.readMulti(this.indexer.indices);
    if (this.map && this.map.dispose) this.map.dispose();

    // const encryptionKey =
    //   this.encryptionKeyFactory && (await this.encryptionKeyFactory());
    // if (encryptionKey) {
    //   for (let item of data) {
    //     const [_key, value] = item;
    //     const decryptedValue = JSON.parse(
    //       await this.indexer.decrypt(encryptionKey, value)
    //     );
    //     item[1] = decryptedValue;
    //   }
    // }

    this.map = new MapStub.Map(data, this.type);
  }

  async clear() {
    await super.clear();
    this.map.clear();
    this.invalidateCache();
  }

  async updateItem(item) {
    await super.updateItem(item);
    this.map.set(item.id, item);
    this.invalidateCache();
  }

  exists(id) {
    const item = this.getItem(id);
    return item && !item.deleted;
  }

  has(id) {
    return this.map.has(id);
  }

  count() {
    return this.map.size;
  }

  getItem(id) {
    return this.map.get(id);
  }

  async deleteItem(id) {
    this.map.delete(id);
    await super.deleteItem(id);
    this.invalidateCache();
  }

  getRaw() {
    return Array.from(this.map.values());
  }

  getItems(map = undefined) {
    if (this.items && this.items.length === this.map.size) return this.items;

    this.items = [];
    this.map.forEach((value) => {
      if (!value || value.deleted || !value.id) return;
      value = map ? map(value) : value;
      this.items.push(value);
    });
    this.items.sort((a, b) => b.dateCreated - a.dateCreated);
    return this.items;
  }

  async setItems(items) {
    await super.setItems(items);
    for (let item of items) {
      if (item) {
        this.map.set(item.id, item);
      }
    }

    this.invalidateCache();
  }

  invalidateCache() {
    this.items = undefined;
  }
}
