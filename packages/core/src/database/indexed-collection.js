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

import { EVENTS } from "../common";
import { toChunks } from "../utils/array";
import Indexer from "./indexer";

export default class IndexedCollection {
  constructor(context, type, eventManager) {
    this.indexer = new Indexer(context, type);
    this.eventManager = eventManager;
    // this.encryptionKeyFactory = encryptionKeyFactory;
  }

  clear() {
    return this.indexer.clear();
  }

  async init() {
    await this.indexer.init();
  }

  async addItem(item) {
    if (!item.id) throw new Error("The item must contain the id field.");

    const exists = this.exists(item.id);
    if (!exists) item.dateCreated = item.dateCreated || Date.now();
    await this.updateItem(item);
    if (!exists) {
      await this.indexer.index(item.id);
    }
  }

  async updateItem(item) {
    if (!item.id) throw new Error("The item must contain the id field.");
    this.eventManager.publish(EVENTS.databaseUpdated, item.id, item);

    // if item is newly synced, remote will be true.
    if (!item.remote) {
      item.dateModified = Date.now();
      item.synced = false;
    }
    // the item has become local now, so remove the flags
    delete item.remote;

    // if (await this.getEncryptionKey()) {
    //   const encrypted = await this.indexer.encrypt(
    //     await this.getEncryptionKey(),
    //     JSON.stringify(item)
    //   );
    //   encrypted.dateModified = item.dateModified;
    //   encrypted.localOnly = item.localOnly;
    //   encrypted.id = item.id;
    //   await this.indexer.write(item.id, encrypted);
    // } else

    await this.indexer.write(item.id, item);
  }

  removeItem(id) {
    this.eventManager.publish(EVENTS.databaseUpdated, id);
    return this.updateItem({
      id,
      deleted: true
    });
  }

  async deleteItem(id) {
    this.eventManager.publish(EVENTS.databaseUpdated, id);
    await this.indexer.deindex(id);
    return await this.indexer.remove(id);
  }

  exists(id) {
    return this.indexer.exists(id);
  }

  async getItem(id) {
    const item = await this.indexer.read(id);
    if (!item) return;

    // if ((await this.getEncryptionKey()) && item.iv && item.cipher) {
    //   return JSON.parse(
    //     await this.indexer.decrypt(await this.getEncryptionKey(), item)
    //   );
    // } else
    return item;
  }

  async getItems(indices) {
    const data = await this.indexer.readMulti(indices);
    return Object.fromEntries(data);
  }

  setItems(items) {
    return this.indexer.writeMulti(items);
  }

  async getEncryptionKey() {
    if (!this.encryptionKeyFactory) return;
    if (this.encryptionKey) return this.encryptionKey;
    this.encryptionKey = await this.encryptionKeyFactory();
    return this.encryptionKey;
  }

  async *iterate(chunkSize) {
    const chunks = toChunks(this.indexer.indices, chunkSize);
    for (const chunk of chunks) {
      yield await this.indexer.readMulti(chunk);
    }
  }
}
