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
import { StorageAccessor } from "../interfaces";
import {
  CollectionType,
  Collections,
  ItemMap,
  MaybeDeletedItem,
  isDeleted
} from "../types";
import EventManager from "../utils/event-manager";
import Indexer from "./indexer";

export class IndexedCollection<
  TCollectionType extends CollectionType = CollectionType,
  T extends ItemMap[Collections[TCollectionType]] = ItemMap[Collections[TCollectionType]]
> {
  readonly indexer: Indexer<T>;

  constructor(
    storage: StorageAccessor,
    type: TCollectionType,
    private readonly eventManager: EventManager
  ) {
    this.indexer = new Indexer(storage, type);
  }

  clear() {
    return this.indexer.clear();
  }

  async init() {
    await this.indexer.init();
  }

  async addItem(item: MaybeDeletedItem<T>) {
    if (!item.id) throw new Error("The item must contain the id field.");

    const exists = this.exists(item.id);
    if (!exists && !isDeleted(item))
      item.dateCreated = item.dateCreated || Date.now();
    await this.updateItem(item);
    if (!exists) {
      await this.indexer.index(item.id);
    }
  }

  async updateItem(item: MaybeDeletedItem<T>) {
    if (!item.id) throw new Error("The item must contain the id field.");
    this.eventManager.publish(EVENTS.databaseUpdated, item.id, item);

    // if item is newly synced, remote will be true.
    if (!item.remote) {
      item.dateModified = Date.now();
      item.synced = false;
    }
    // the item has become local now, so remove the flags
    delete item.remote;
    await this.indexer.write(item.id, item);
  }

  removeItem(id: string) {
    this.eventManager.publish(EVENTS.databaseUpdated, id);
    return this.indexer.write(id, {
      id,
      deleted: true,
      dateModified: Date.now()
    });
  }

  async deleteItem(id: string) {
    this.eventManager.publish(EVENTS.databaseUpdated, id);
    await this.indexer.deindex(id);
    return await this.indexer.remove(id);
  }

  exists(id: string) {
    return this.indexer.exists(id);
  }

  async getItem(id: string) {
    const item = await this.indexer.read(id);
    if (!item) return;
    return item;
  }

  async getItems(indices: string[]) {
    const data = await this.indexer.readMulti(indices);
    return Object.fromEntries(data);
  }

  setItems(items: (MaybeDeletedItem<T> | undefined)[]) {
    const entries = items.reduce((array, item) => {
      if (!item) return array;

      if (!item.remote) {
        item.dateModified = Date.now();
        item.synced = false;
      }
      delete item.remote;

      array.push([item.id, item]);
      return array;
    }, [] as [string, MaybeDeletedItem<T>][]);
    return this.indexer.writeMulti(entries);
  }

  async *iterate(chunkSize: number) {
    const chunks = toChunks(this.indexer.indices, chunkSize);
    for (const chunk of chunks) {
      yield await this.indexer.readMulti(chunk);
    }
  }
}
