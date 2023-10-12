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
import { GroupOptions, Item, MaybeDeletedItem, isDeleted } from "../types";
import EventManager from "../utils/event-manager";
import {
  DatabaseAccessor,
  DatabaseCollection,
  DatabaseSchema,
  SQLiteItem,
  isFalse
} from ".";
import { ExpressionOrFactory, SelectQueryBuilder, SqlBool } from "kysely";
import { VirtualizedGrouping } from "../utils/virtualized-grouping";
import { groupArray } from "../utils/grouping";

export class SQLCollection<
  TCollectionType extends keyof DatabaseSchema,
  T extends DatabaseSchema[TCollectionType] = DatabaseSchema[TCollectionType]
> implements DatabaseCollection<SQLiteItem<T>, true>
{
  constructor(
    private readonly db: DatabaseAccessor,
    private readonly type: TCollectionType,
    private readonly eventManager: EventManager
  ) {}

  async clear() {
    await this.db().deleteFrom(this.type).execute();
  }

  async init() {}

  async upsert(item: SQLiteItem<T>) {
    if (!item.id) throw new Error("The item must contain the id field.");
    if (!item.deleted) item.dateCreated = item.dateCreated || Date.now();
    this.eventManager.publish(EVENTS.databaseUpdated, item.id, item);

    // if item is newly synced, remote will be true.
    if (!item.remote) {
      item.dateModified = Date.now();
      item.synced = false;
    }
    // the item has become local now, so remove the flags
    delete item.remote;

    await this.db()
      .replaceInto<keyof DatabaseSchema>(this.type)
      .values(item)
      .execute();
  }

  async softDelete(ids: string[]) {
    this.eventManager.publish(EVENTS.databaseUpdated, ids);
    await this.db()
      .replaceInto<keyof DatabaseSchema>(this.type)
      .values(
        ids.map((id) => ({
          id,
          deleted: true,
          dateModified: Date.now()
        }))
      )
      .execute();
  }

  async delete(ids: string[]) {
    this.eventManager.publish(EVENTS.databaseUpdated, ids);
    await this.db()
      .deleteFrom<keyof DatabaseSchema>(this.type)
      .where("id", "in", ids)
      .execute();
  }

  async exists(id: string) {
    const { count } =
      (await this.db()
        .selectFrom<keyof DatabaseSchema>(this.type)
        .select((a) => a.fn.count<number>("id").as("count"))
        .where("id", "==", id)
        .where(isFalse("deleted"))
        .limit(1)
        .executeTakeFirst()) || {};

    return count !== undefined && count > 0;
  }

  async count() {
    const { count } =
      (await this.db()
        .selectFrom<keyof DatabaseSchema>(this.type)
        .select((a) => a.fn.count<number>("id").as("count"))
        .where(isFalse("deleted"))
        .executeTakeFirst()) || {};
    return count || 0;
  }

  async get(id: string) {
    const item = await this.db()
      .selectFrom<keyof DatabaseSchema>(this.type)
      .selectAll()
      .where("id", "==", id)
      .executeTakeFirst();
    if (!item || isDeleted(item)) return;
    return item as T;
  }

  async put(items: (SQLiteItem<T> | undefined)[]) {
    const entries = items.reduce((array, item) => {
      if (!item) return array;
      if (!item.remote) {
        item.dateModified = Date.now();
        item.synced = false;
      }
      delete item.remote;
      array.push(item);
      return array;
    }, [] as SQLiteItem<T>[]);

    if (entries.length <= 0) return;
    await this.db()
      .replaceInto<keyof DatabaseSchema>(this.type)
      .values(entries)
      .execute();
  }

  async update(ids: string[], partial: Partial<SQLiteItem<T>>) {
    await this.db()
      .updateTable<keyof DatabaseSchema>(this.type)
      .where("id", "in", ids)
      .set({
        ...partial,
        dateModified: Date.now()
      })
      .execute();
  }

  async ids(sortOptions: GroupOptions): Promise<string[]> {
    const ids = await this.db()
      .selectFrom<keyof DatabaseSchema>(this.type)
      .select("id")
      .where(isFalse("deleted"))
      .$if(this.type === "notes" || this.type === "notebooks", (eb) =>
        eb.where(isFalse("dateDeleted"))
      )
      .orderBy(sortOptions.sortBy, sortOptions.sortDirection)
      .execute();
    return ids.map((id) => id.id);
  }

  async items(
    ids: string[]
  ): Promise<Record<string, MaybeDeletedItem<T> | undefined>> {
    const results = await this.db()
      .selectFrom<keyof DatabaseSchema>(this.type)
      .selectAll()
      .where("id", "in", ids)
      .execute();
    const items: Record<string, MaybeDeletedItem<T>> = {};
    for (const item of results) {
      items[item.id] = item as MaybeDeletedItem<T>;
    }
    return items;
  }

  async *unsynced(
    after: number,
    chunkSize: number
  ): AsyncIterableIterator<MaybeDeletedItem<T>[]> {
    let index = 0;
    while (true) {
      const rows = await this.db()
        .selectFrom<keyof DatabaseSchema>(this.type)
        .selectAll()
        .orderBy("dateModified", "asc")
        .$if(after > 0, (eb) =>
          eb.where("dateModified", ">", after).where(isFalse("synced"))
        )
        .$if(this.type === "attachments", (eb) =>
          eb.where("dateUploaded", ">", 0)
        )
        .offset(index)
        .limit(chunkSize)
        .execute();
      if (rows.length === 0) break;
      index += chunkSize;
      yield rows as MaybeDeletedItem<T>[];
    }
  }

  async *stream(): AsyncIterableIterator<T> {
    let index = 0;
    const chunkSize = 50;
    while (true) {
      const rows = await this.db()
        .selectFrom<keyof DatabaseSchema>(this.type)
        .where(isFalse("deleted"))
        .orderBy("dateCreated desc")
        .selectAll()
        .offset(index)
        .limit(chunkSize)
        .execute();
      if (rows.length === 0) break;
      index += chunkSize;
      for (const row of rows) {
        yield row as T;
      }
    }
  }

  createFilter<T extends Item>(
    selector: (
      qb: SelectQueryBuilder<DatabaseSchema, keyof DatabaseSchema, unknown>
    ) => SelectQueryBuilder<DatabaseSchema, keyof DatabaseSchema, unknown>,
    batchSize = 50
  ) {
    return new FilteredSelector<T>(
      this.db().selectFrom<keyof DatabaseSchema>(this.type).$call(selector),
      batchSize
    );
  }
}

export class FilteredSelector<T extends Item> {
  constructor(
    readonly filter: SelectQueryBuilder<
      DatabaseSchema,
      keyof DatabaseSchema,
      unknown
    >,
    readonly batchSize: number
  ) {}

  async ids(sortOptions?: GroupOptions) {
    return (
      await this.filter
        .$if(!!sortOptions, (eb) =>
          eb.$call(this.buildSortExpression(sortOptions!))
        )
        .select("id")
        .execute()
    ).map((i) => i.id);
  }

  async items(ids?: string[], sortOptions?: GroupOptions) {
    return (await this.filter
      .$if(!!ids && ids.length > 0, (eb) => eb.where("id", "in", ids!))
      .$if(!!sortOptions, (eb) =>
        eb.$call(this.buildSortExpression(sortOptions!))
      )
      .selectAll()
      .execute()) as T[];
  }

  async has(id: string) {
    const { count } =
      (await this.filter
        .where("id", "==", id)
        .limit(1)
        .select((a) => a.fn.count<number>("id").as("count"))
        .executeTakeFirst()) || {};
    return count !== undefined && count > 0;
  }

  async count() {
    const { count } =
      (await this.filter
        .select((a) => a.fn.count<number>("id").as("count"))
        .executeTakeFirst()) || {};
    return count || 0;
  }

  async find(
    filter: ExpressionOrFactory<DatabaseSchema, keyof DatabaseSchema, SqlBool>
  ) {
    const item = await this.filter
      .where(filter)
      .limit(1)
      .selectAll()
      .executeTakeFirst();
    return item as T | undefined;
  }

  async *map<TReturnType>(
    fn: (item: T) => TReturnType
  ): AsyncIterableIterator<TReturnType> {
    for await (const item of this) {
      yield fn(item);
    }
  }

  async grouped(options: GroupOptions) {
    const ids = await this.ids(options);
    return {
      ids,
      grouping: new VirtualizedGrouping<T>(
        ids,
        this.batchSize,
        async (ids) => {
          const results = await this.filter
            .where("id", "in", ids)
            .selectAll()
            .execute();
          const items: Record<string, T> = {};
          for (const item of results) {
            items[item.id] = item as T;
          }
          return items;
        },
        (ids, items) => groupArray(ids, items, options)
      )
    };
  }

  private buildSortExpression(options: GroupOptions) {
    return <T>(
      qb: SelectQueryBuilder<DatabaseSchema, keyof DatabaseSchema, T>
    ) => {
      return qb
        .orderBy("conflicted desc")
        .orderBy("pinned desc")
        .orderBy(options.sortBy, options.sortDirection);
    };
  }

  async *[Symbol.asyncIterator]() {
    let index = 0;
    while (true) {
      const rows = await this.filter
        .selectAll()
        .orderBy("dateCreated asc")
        .offset(index)
        .limit(this.batchSize)
        .execute();
      if (rows.length === 0) break;
      index += this.batchSize;
      for (const row of rows) {
        yield row as T;
      }
    }
  }
}
