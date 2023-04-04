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
import { MapStub } from "../utils/map";
import {
  BaseItem,
  Collections,
  CollectionType,
  isDeleted,
  MaybeDeletedItem
} from "../entities";
import { IStorage } from "../interfaces";

export default class CachedCollection<
  TCollectionType extends CollectionType,
  T extends BaseItem<Collections[TCollectionType]>
> extends IndexedCollection<TCollectionType, T> {
  private cache = new Map<string, MaybeDeletedItem<T>>();
  private items?: T[];

  constructor(storage: IStorage, type: TCollectionType) {
    super(storage, type);
  }

  async init() {
    await super.init();
    const data = await this.indexer.readMulti(this.indexer.getIndices());
    if ("dispose" in this.cache && typeof this.cache.dispose === "function")
      this.cache.dispose();

    this.cache = new MapStub.Map(data);
    this.resetCache();
  }

  async clear() {
    await super.clear();
    this.cache.clear();
    this.resetCache();
  }

  async updateItem(item: T) {
    await super.updateItem(item);
    this.cache.set(item.id, item);
    this.resetCache();
  }

  async deleteItem(id: string) {
    this.cache.delete(id);
    await super.deleteItem(id);
    this.resetCache();
  }

  async removeItem(id: string) {
    this.cache.set(id, { id, deleted: true });
    await super.removeItem(id);
    this.resetCache();
  }

  exists(id: string) {
    const item = this.cache.get(id);
    return super.exists(id) && !!item && !isDeleted(item);
  }

  has(id: string) {
    return this.cache.has(id);
  }

  count() {
    return this.cache.size;
  }

  getItem(id: string) {
    const item = this.cache.get(id);
    if (!item || isDeleted(item)) return;
    return item;
  }

  getRaw() {
    return Array.from(this.cache.values());
  }

  getItems(manipulate?: (item: T) => T) {
    if (this.items && this.items.length === this.cache.size) return this.items;

    this.items = [];
    this.cache.forEach((value) => {
      if (isDeleted(value)) return;
      value = manipulate ? manipulate(value) : value;
      this.items?.push(value);
    });
    this.items.sort((a, b) => b.dateCreated - a.dateCreated);
    return this.items;
  }

  resetCache() {
    this.items = undefined;
  }
}
