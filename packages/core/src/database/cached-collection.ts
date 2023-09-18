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

import { IndexedCollection } from "./indexed-collection";
import {
  CollectionType,
  Collections,
  ItemMap,
  MaybeDeletedItem,
  isDeleted
} from "../types";
import { StorageAccessor } from "../interfaces";
import EventManager from "../utils/event-manager";
import { chunkedIterate } from "../utils/array";

export class CachedCollection<
  TCollectionType extends CollectionType,
  T extends ItemMap[Collections[TCollectionType]]
> {
  private collection: IndexedCollection<TCollectionType, T>;
  private cache = new Map<string, MaybeDeletedItem<T>>();
  private cachedItems?: T[];

  constructor(
    storage: StorageAccessor,
    type: TCollectionType,
    eventManager: EventManager
  ) {
    this.collection = new IndexedCollection(storage, type, eventManager);
  }

  async init() {
    await this.collection.init();
    const data = await this.collection.indexer.readMulti(
      this.collection.indexer.indices
    );
    this.cache = new Map(data);
  }

  async add(item: MaybeDeletedItem<T>) {
    await this.collection.addItem(item);
    this.cache.set(item.id, item);
    this.invalidateCache();
  }

  async clear() {
    await this.collection.clear();
    this.cache.clear();
    this.invalidateCache();
  }

  async update(item: T) {
    await this.collection.updateItem(item);
    this.cache.set(item.id, item);
    this.invalidateCache();
  }

  async delete(id: string) {
    this.cache.delete(id);
    await this.collection.deleteItem(id);
    this.invalidateCache();
  }

  async remove(id: string) {
    this.cache.set(id, {
      id,
      deleted: true,
      dateModified: Date.now()
    });
    await this.collection.removeItem(id);
    this.invalidateCache();
  }

  exists(id: string) {
    const item = this.cache.get(id);
    return this.collection.exists(id) && !!item && !isDeleted(item);
  }

  has(id: string) {
    return this.cache.has(id);
  }

  count() {
    return this.cache.size;
  }

  get(id: string) {
    const item = this.cache.get(id);
    if (!item || isDeleted(item)) return;
    return item;
  }

  getRaw(id: string) {
    const item = this.cache.get(id);
    return item;
  }

  raw() {
    return Array.from(this.cache.values());
  }

  items(map?: (item: T) => T | undefined) {
    if (this.cachedItems && this.cachedItems.length === this.cache.size)
      return this.cachedItems;

    this.cachedItems = [];
    this.cache.forEach((value) => {
      if (isDeleted(value)) return;
      const mapped = map ? map(value) : value;
      if (!mapped) return;
      this.cachedItems?.push(mapped);
    });
    this.cachedItems.sort((a, b) => b.dateCreated - a.dateCreated);
    return this.cachedItems;
  }

  async setItems(items: (MaybeDeletedItem<T> | undefined)[]) {
    await this.collection.setItems(items);
    for (const item of items) {
      if (item) {
        this.cache.set(item.id, item);
      }
    }

    this.invalidateCache();
  }

  *iterateSync(chunkSize: number) {
    yield* chunkedIterate(Array.from(this.cache.values()), chunkSize);
  }

  invalidateCache() {
    this.cachedItems = undefined;
  }
}
