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

import { MaybeDeletedItem, isDeleted } from "../types.js";
import EventManager from "../utils/event-manager.js";
import { DatabaseAccessor, DatabaseCollection, DatabaseSchema } from "./index.js";
import { SQLCollection } from "./sql-collection.js";
import { Kysely } from "@streetwriters/kysely";
import { Sanitizer } from "./sanitizer.js";

export class SQLCachedCollection<
  TCollectionType extends keyof DatabaseSchema,
  T extends DatabaseSchema[TCollectionType] = DatabaseSchema[TCollectionType]
> implements DatabaseCollection<T, false>
{
  private collection: SQLCollection<TCollectionType, T>;
  private cache = new Map<string, MaybeDeletedItem<T> | undefined>();
  // private cachedItems?: T[];

  constructor(
    sql: DatabaseAccessor,
    startTransaction: (
      executor: (tr: Kysely<DatabaseSchema>) => Promise<void>
    ) => Promise<void>,
    public type: TCollectionType,
    eventManager: EventManager,
    sanitizer: Sanitizer
  ) {
    this.collection = new SQLCollection(
      sql,
      startTransaction,
      type,
      eventManager,
      sanitizer
    );
  }

  async init() {
    await this.collection.init();
    const records = await this.collection.records([]);
    this.cache = new Map(Object.entries(records));
    // const data = await this.collection.indexer.readMulti(
    //   this.collection.indexer.indices
    // );
    // this.cache = new Map(data);
  }

  // async add(item: MaybeDeletedItem<T>) {
  //   await this.collection.addItem(item);
  //   this.cache.set(item.id, item);
  //   this.invalidateCache();
  // }

  async clear() {
    await this.collection.clear();
    this.cache.clear();
  }

  async upsert(item: T) {
    await this.collection.upsert(item);
    this.cache.set(item.id, item);
  }

  async delete(ids: string[]) {
    ids.forEach((id) => this.cache.delete(id));
    await this.collection.delete(ids);
  }

  async softDelete(ids: string[]) {
    ids.forEach((id) =>
      this.cache.set(id, {
        id,
        deleted: true,
        dateModified: Date.now(),
        synced: false
      })
    );
    await this.collection.softDelete(ids);
  }

  exists(id: string) {
    const item = this.cache.get(id);
    return !!item && !isDeleted(item);
  }

  count(): number {
    return this.cache.size;
  }

  get(id: string): T | undefined {
    const item = this.cache.get(id);
    if (!item || isDeleted(item)) return;
    return item;
  }

  async put(items: (T | undefined)[]) {
    const entries = await this.collection.put(items);
    for (const item of entries) {
      this.cache.set(item.id, item as T);
    }
    return entries;
  }

  async update(ids: string[], partial: Partial<T>): Promise<void> {
    await this.collection.update(ids, partial);
    for (const id of ids) {
      const item = this.cache.get(id);
      if (!item) continue;
      this.cache.set(id, { ...item, ...partial, dateModified: Date.now() });
    }
  }

  records(ids: string[]): Record<string, MaybeDeletedItem<T> | undefined> {
    const items: Record<string, MaybeDeletedItem<T> | undefined> = {};
    for (const id of ids) {
      items[id] = this.cache.get(id);
    }
    return items;
  }

  items(ids?: string[]): T[] {
    const items: T[] = [];
    if (ids) {
      for (const id of ids) {
        const item = this.cache.get(id);
        if (!item || isDeleted(item)) continue;
        items.push(item);
      }
    } else {
      for (const [_key, value] of this.cache) {
        if (!value || isDeleted(value)) continue;
        items.push(value);
      }
    }
    return items;
  }

  *unsynced(chunkSize: number): IterableIterator<MaybeDeletedItem<T>[]> {
    let chunk: MaybeDeletedItem<T>[] = [];
    for (const [_key, value] of this.cache) {
      if (value && !value.synced) {
        chunk.push(value);
        if (chunk.length === chunkSize) {
          yield chunk;
          chunk = [];
        }
      }
    }
    if (chunk.length > 0) yield chunk;
  }

  *stream(): IterableIterator<T> {
    for (const [_key, value] of this.cache) {
      if (value && !value.deleted) yield value as T;
    }
  }

  async unsyncedCount() {
    return this.collection.unsyncedCount();
  }

  // has(id: string) {
  //   return this.cache.has(id);
  // }

  // count() {
  //   return this.cache.size;
  // }

  // get(id: string) {
  //   const item = this.cache.get(id);
  //   if (!item || isDeleted(item)) return;
  //   return item;
  // }

  // getRaw(id: string) {
  //   const item = this.cache.get(id);
  //   return item;
  // }

  // raw() {
  //   return Array.from(this.cache.values());
  // }

  // items(map?: (item: T) => T | undefined) {
  //   if (this.cachedItems && this.cachedItems.length === this.cache.size)
  //     return this.cachedItems;

  //   this.cachedItems = [];
  //   this.cache.forEach((value) => {
  //     if (isDeleted(value)) return;
  //     const mapped = map ? map(value) : value;
  //     if (!mapped) return;
  //     this.cachedItems?.push(mapped);
  //   });
  //   this.cachedItems.sort((a, b) => b.dateCreated - a.dateCreated);
  //   return this.cachedItems;
  // }

  // async setItems(items: (MaybeDeletedItem<T> | undefined)[]) {
  //   await this.collection.setItems(items);
  // for (const item of items) {
  //   if (item) {
  //     this.cache.set(item.id, item);
  //   }
  // }

  //   this.invalidateCache();
  // }

  // *iterateSync(chunkSize: number) {
  //   yield* chunkedIterate(Array.from(this.cache.values()), chunkSize);
  // }

  // invalidateCache() {
  //   this.cachedItems = undefined;
  // }
}
