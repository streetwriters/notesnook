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
import {
  GroupOptions,
  Item,
  MaybeDeletedItem,
  SortOptions,
  isDeleted
} from "../types";
import EventManager from "../utils/event-manager";
import {
  DatabaseAccessor,
  DatabaseCollection,
  DatabaseSchema,
  SQLiteItem,
  isFalse
} from ".";
import {
  AnyColumn,
  AnyColumnWithTable,
  ExpressionOrFactory,
  SelectQueryBuilder,
  SqlBool,
  Transaction,
  sql
} from "kysely";
import { VirtualizedGrouping } from "../utils/virtualized-grouping";
import { groupArray } from "../utils/grouping";
import { toChunks } from "../utils/array";

export class SQLCollection<
  TCollectionType extends keyof DatabaseSchema,
  T extends DatabaseSchema[TCollectionType] = DatabaseSchema[TCollectionType]
> implements DatabaseCollection<SQLiteItem<T>, true>
{
  constructor(
    private readonly db: DatabaseAccessor,
    private readonly startTransaction: (
      executor: (tr: Transaction<DatabaseSchema>) => void | Promise<void>
    ) => Promise<void>,
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
          dateModified: Date.now(),
          synced: false
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

    await this.startTransaction(async (tx) => {
      for (const chunk of toChunks(entries, 200)) {
        await tx
          .replaceInto<keyof DatabaseSchema>(this.type)
          .values(chunk)
          .execute();
      }
    });
  }

  async update(ids: string[], partial: Partial<SQLiteItem<T>>) {
    await this.db()
      .updateTable<keyof DatabaseSchema>(this.type)
      .where("id", "in", ids)
      .set({
        ...partial,
        dateModified: Date.now(),
        synced: partial.synced || false
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

  async records(
    ids: string[]
  ): Promise<Record<string, MaybeDeletedItem<T> | undefined>> {
    const results = await this.db()
      .selectFrom<keyof DatabaseSchema>(this.type)
      .selectAll()
      .$if(ids.length > 0, (eb) => eb.where("id", "in", ids))
      .execute();
    const items: Record<string, MaybeDeletedItem<T>> = {};
    for (const item of results) {
      items[item.id] = item as MaybeDeletedItem<T>;
    }
    return items;
  }

  async *unsynced(
    chunkSize: number,
    forceSync?: boolean
  ): AsyncIterableIterator<MaybeDeletedItem<T>[]> {
    let lastRowId: string | null = null;
    while (true) {
      const rows = (await this.db()
        .selectFrom<keyof DatabaseSchema>(this.type)
        .selectAll()
        .$if(lastRowId != null, (qb) => qb.where("id", ">", lastRowId!))
        .$if(!forceSync, (eb) => eb.where(isFalse("synced")))
        .$if(this.type === "attachments", (eb) =>
          eb.where((eb) =>
            eb.or([eb("dateUploaded", ">", 0), eb("deleted", "==", true)])
          )
        )
        .orderBy("id")
        .limit(chunkSize)
        .execute()) as MaybeDeletedItem<T>[];
      if (rows.length === 0) break;
      yield rows;

      lastRowId = rows[rows.length - 1].id;
    }
  }

  async *stream(chunkSize: number): AsyncIterableIterator<T> {
    let lastRow: T | null = null;
    while (true) {
      const rows = (await this.db()
        .selectFrom<keyof DatabaseSchema>(this.type)
        .where(isFalse("deleted"))
        .orderBy("dateCreated asc")
        .orderBy("id asc")
        .$if(lastRow !== null, (qb) =>
          qb.where(
            (eb) => eb.refTuple("dateCreated", "id"),
            ">",
            (eb) => eb.tuple(lastRow!.dateCreated, lastRow!.id)
          )
        )
        .selectAll()
        .limit(chunkSize)
        .execute()) as T[];
      if (rows.length === 0) break;
      for (const row of rows) {
        yield row;
      }
      lastRow = rows[rows.length - 1];
    }
  }

  createFilter<T extends Item>(
    selector: (
      qb: SelectQueryBuilder<DatabaseSchema, keyof DatabaseSchema, unknown>
    ) => SelectQueryBuilder<DatabaseSchema, keyof DatabaseSchema, unknown>,
    batchSize?: number
  ) {
    return new FilteredSelector<T>(
      this.type,
      this.db().selectFrom<keyof DatabaseSchema>(this.type).$call(selector),
      batchSize
    );
  }
}

export class FilteredSelector<T extends Item> {
  private _fields: AnyColumnWithTable<DatabaseSchema, keyof DatabaseSchema>[] =
    [];
  filter: SelectQueryBuilder<DatabaseSchema, keyof DatabaseSchema, unknown>;
  private _limit = 0;
  constructor(
    readonly type: keyof DatabaseSchema,
    filter: SelectQueryBuilder<DatabaseSchema, keyof DatabaseSchema, unknown>,
    readonly batchSize: number = 500
  ) {
    this.filter = filter;
  }

  fields(fields: AnyColumnWithTable<DatabaseSchema, keyof DatabaseSchema>[]) {
    this._fields = fields;
    return this;
  }

  limit(limit: number) {
    this._limit = limit;
    return this;
  }

  async ids(sortOptions?: SortOptions) {
    return (
      await this.filter
        .$if(!!sortOptions, (eb) =>
          eb.$call(this.buildSortExpression(sortOptions!))
        )
        .select("id")
        .execute()
    ).map((i) => i.id);
  }

  async items(ids?: string[], sortOptions?: SortOptions) {
    if (ids && !ids?.length) return [];
    return (await this.filter
      .$if(!!ids && ids.length > 0, (eb) => eb.where("id", "in", ids!))
      .$if(!!sortOptions, (eb) =>
        eb.$call(this.buildSortExpression(sortOptions!))
      )
      .$if(this._fields.length === 0, (eb) => eb.selectAll())
      .$if(this._fields.length > 0, (eb) => eb.select(this._fields))
      .$if(!!this._limit, (eb) => eb.limit(this._limit))
      .execute()) as T[];
  }

  async records(ids?: string[], sortOptions?: SortOptions) {
    if (ids && !ids?.length) return {};
    const results = await this.items(ids, sortOptions);
    const items: Record<string, T> = {};
    for (const item of results) {
      items[item.id] = item as T;
    }
    return items;
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
      .$if(this._fields.length === 0, (eb) => eb.selectAll())
      .$if(this._fields.length > 0, (eb) => eb.select(this._fields))
      .executeTakeFirst();
    return item as T | undefined;
  }

  where(
    expr: ExpressionOrFactory<DatabaseSchema, keyof DatabaseSchema, SqlBool>
  ) {
    this.filter = this.filter.where(expr);
    return this;
  }

  async *map<TReturnType>(
    fn: (item: T) => TReturnType
  ): AsyncIterableIterator<TReturnType> {
    for await (const item of this) {
      yield fn(item);
    }
  }

  async grouped(options: GroupOptions) {
    const count = await this.count();
    return new VirtualizedGrouping<T>(
      count,
      this.batchSize,
      () => this.ids(options),
      async (start, end) => {
        const items = (await this.filter
          .$call(this.buildSortExpression(options))
          .offset(start)
          .limit(end - start)
          .selectAll()
          .execute()) as T[];
        return {
          ids: items.map((i) => i.id),
          items
        };
      },
      (items) => groupArray(items as any, options),
      () => this.groups(options)
    );
  }

  async groups(options: GroupOptions) {
    const fields: Array<
      | AnyColumnWithTable<DatabaseSchema, keyof DatabaseSchema>
      | AnyColumn<DatabaseSchema, keyof DatabaseSchema>
    > = ["id", "type", options.sortBy];
    if (this.type === "notes") fields.push("notes.pinned", "notes.conflicted");
    else if (this.type === "notebooks") fields.push("notebooks.pinned");
    else if (this.type === "attachments" && options.groupBy === "abc")
      fields.push("attachments.filename");
    else if (this.type === "reminders") {
      fields.push(
        "reminders.mode",
        "reminders.date",
        "reminders.recurringMode",
        "reminders.selectedDays",
        "reminders.disabled",
        "reminders.snoozeUntil"
      );
    }
    return Array.from(
      groupArray(
        await this.filter
          .$call(this.buildSortExpression(options))
          .select(fields)
          .execute(),
        options
      ).values()
    );
  }

  async sorted(options: SortOptions) {
    const count = await this.count();

    return new VirtualizedGrouping<T>(
      count,
      this.batchSize,
      () => this.ids(options),
      async (start, end) => {
        const items = (await this.filter
          .$call(this.buildSortExpression(options))
          .offset(start)
          .limit(end - start)
          .selectAll()
          .execute()) as T[];
        return {
          ids: items.map((i) => i.id),
          items
        };
      }
    );
  }

  async *[Symbol.asyncIterator]() {
    let lastRow: any | null = null;
    while (true) {
      const rows = await this.filter
        .orderBy("dateCreated asc")
        .orderBy("id asc")
        .$if(lastRow !== null, (qb) =>
          qb.where(
            (eb) => eb.refTuple("dateCreated", "id"),
            ">",
            (eb) => eb.tuple(lastRow.dateCreated, lastRow.id)
          )
        )
        .limit(this.batchSize)
        .$if(this._fields.length === 0, (eb) => eb.selectAll())
        .$if(this._fields.length > 0, (eb) => eb.select(this._fields))
        .execute();
      if (rows.length === 0) break;
      for (const row of rows) {
        yield row as T;
      }

      lastRow = rows[rows.length - 1];
    }
  }

  private buildSortExpression(options: SortOptions, persistent?: boolean) {
    return <T>(
      qb: SelectQueryBuilder<DatabaseSchema, keyof DatabaseSchema, T>
    ) => {
      return qb
        .$if(this.type === "notes", (eb) => eb.orderBy("conflicted desc"))
        .$if(this.type === "notes" || this.type === "notebooks", (eb) =>
          eb.orderBy("pinned desc")
        )
        .$if(options.sortBy === "title", (eb) =>
          eb.orderBy(
            sql`ltrim(${sql.raw(
              options.sortBy
            )}, ' \u00a0\r\n\t\v') COLLATE NOCASE ${sql.raw(
              options.sortDirection
            )}`
          )
        )
        .$if(options.sortBy !== "title", (eb) =>
          eb.orderBy(options.sortBy, options.sortDirection)
        )
        .$if(!!persistent, (eb) => eb.orderBy("id asc"));
    };
  }

  private sortFields(options: SortOptions, persistent?: boolean) {
    const fields: Array<
      | AnyColumnWithTable<DatabaseSchema, keyof DatabaseSchema>
      | AnyColumn<DatabaseSchema, keyof DatabaseSchema>
    > = [];
    if (this.type === "notes") fields.push("conflicted");
    if (this.type === "notes" || this.type === "notebooks")
      fields.push("pinned");
    fields.push(options.sortBy);
    if (persistent) fields.push("id");
    return fields;
  }
}
