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

import { EVENTS } from "../common.js";
import {
  GroupOptions,
  Item,
  MaybeDeletedItem,
  SortOptions,
  isDeleted
} from "../types.js";
import EventManager from "../utils/event-manager.js";
import {
  DatabaseAccessor,
  DatabaseCollection,
  DatabaseSchema,
  DeleteEvent,
  SQLiteItem,
  UpdateEvent,
  UpsertEvent,
  isFalse
} from "./index.js";
import {
  AliasedRawBuilder,
  AnyColumn,
  AnyColumnWithTable,
  ExpressionOrFactory,
  Kysely,
  SelectQueryBuilder,
  SqlBool,
  sql
} from "@streetwriters/kysely";
import { VirtualizedGrouping } from "../utils/virtualized-grouping.js";
import { createKeySelector, groupArray } from "../utils/grouping.js";
import { toChunks } from "../utils/array.js";
import { Sanitizer } from "./sanitizer.js";
import {
  createIsReminderActiveQuery,
  createUpcomingReminderTimeQuery
} from "../collections/reminders.js";

const formats = {
  month: "%Y-%m",
  year: "%Y",
  week: "%Y-%W",
  abc: null,
  default: "%Y-%W",
  none: null
} satisfies Record<GroupOptions["groupBy"], string | null>;
export const MAX_SQL_PARAMETERS = 200;

export class SQLCollection<
  TCollectionType extends keyof DatabaseSchema,
  T extends DatabaseSchema[TCollectionType] = DatabaseSchema[TCollectionType]
> implements DatabaseCollection<SQLiteItem<T>, true>
{
  constructor(
    private readonly db: DatabaseAccessor,
    _startTransaction: (
      executor: (tr: Kysely<DatabaseSchema>) => Promise<void>
    ) => Promise<void>,
    public readonly type: TCollectionType,
    private readonly eventManager: EventManager,
    private readonly sanitizer: Sanitizer
  ) {}

  async clear() {
    await this.db().deleteFrom(this.type).execute();
  }

  async init() {}

  async upsert(item: SQLiteItem<T>) {
    if (!item.id) throw new Error("The item must contain the id field.");
    if (!item.deleted) item.dateCreated = item.dateCreated || Date.now();

    // if item is newly synced, remote will be true.
    if (!item.remote) {
      item.dateModified = Date.now();
      item.synced = false;
    }
    // the item has become local now, so remove the flags
    delete item.remote;

    if (!this.sanitizer.sanitize(this.type, item)) return;

    await this.db()
      .replaceInto<keyof DatabaseSchema>(this.type)
      .values(item)
      .execute();

    this.eventManager.publish(EVENTS.databaseUpdated, <UpsertEvent>{
      type: "upsert",
      collection: this.type,
      item
    });
  }

  async softDelete(ids: string[]) {
    await this.db()
      .transaction()
      .execute(async (tx) => {
        for (const chunk of toChunks(ids, MAX_SQL_PARAMETERS)) {
          await tx
            .replaceInto<keyof DatabaseSchema>(this.type)
            .values(
              chunk.map((id) => ({
                id,
                deleted: true,
                dateModified: Date.now(),
                synced: false
              }))
            )
            .execute();
        }
      });
    this.eventManager.publish(EVENTS.databaseUpdated, <DeleteEvent>{
      type: "softDelete",
      collection: this.type,
      ids
    });
  }

  async delete(ids: string[]) {
    if (ids.length <= 0) return;

    await this.db()
      .transaction()
      .execute(async (tx) => {
        for (const chunk of toChunks(ids, MAX_SQL_PARAMETERS)) {
          await tx
            .deleteFrom<keyof DatabaseSchema>(this.type)
            .where("id", "in", chunk)
            .execute();
        }
      });
    this.eventManager.publish(EVENTS.databaseUpdated, <DeleteEvent>{
      type: "delete",
      collection: this.type,
      ids
    });
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
    if (items.length <= 0) return [];
    const entries = items.reduce((array, item) => {
      if (!item) return array;
      if (!item.remote) {
        // NOTE: this is intentional
        // When we are bulk adding items, we shouldn't touch the dateModified
        // item.dateModified = Date.now();
        item.synced = false;
      }
      delete item.remote;

      if (!this.sanitizer.sanitize(this.type, item)) return array;

      array.push(item);
      return array;
    }, [] as SQLiteItem<T>[]);

    if (entries.length <= 0) return [];

    await this.db()
      .transaction()
      .execute(async (tx) => {
        for (const chunk of toChunks(entries, MAX_SQL_PARAMETERS)) {
          await tx
            .replaceInto<keyof DatabaseSchema>(this.type)
            .values(chunk)
            .execute();
        }
      });
    return entries;
  }

  async update(
    ids: string[],
    partial: Partial<SQLiteItem<T>>,
    options: {
      sendEvent?: boolean;
      modify?: boolean;
      condition?: ExpressionOrFactory<
        DatabaseSchema,
        keyof DatabaseSchema,
        SqlBool
      >;
    } = {}
  ) {
    const { sendEvent = true, modify = true, condition } = options;
    if (!this.sanitizer.sanitize(this.type, partial)) return;

    await this.db()
      .transaction()
      .execute(async (tx) => {
        for (const chunk of toChunks(ids, MAX_SQL_PARAMETERS)) {
          await tx
            .updateTable<keyof DatabaseSchema>(this.type)
            .where("id", "in", chunk)
            .$if(!!condition, (eb) => eb.where(condition!))
            .set({
              ...partial,
              dateModified: modify ? Date.now() : undefined,
              synced: partial.synced || false
            })
            .execute();
        }
      });
    if (sendEvent) {
      this.eventManager.publish(EVENTS.databaseUpdated, <UpdateEvent>{
        type: "update",
        collection: this.type,
        ids,
        item: partial
      });
    }
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

  async unsyncedCount() {
    const { count } =
      (await this.db()
        .selectFrom<keyof DatabaseSchema>(this.type)
        .select((a) => a.fn.count<number>("id").as("count"))
        .where(isFalse("synced"))
        .$if(this.type === "content", (eb) =>
          eb.where("conflicted", "is", null)
        )
        .$if(this.type === "notes", (eb) =>
          eb.where("conflicted", "is not", true)
        )
        .$if(this.type === "attachments", (eb) =>
          eb.where((eb) =>
            eb.or([eb("dateUploaded", ">", 0), eb("deleted", "==", true)])
          )
        )
        .executeTakeFirst()) || {};
    return count || 0;
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
        .$if(this.type === "content", (eb) =>
          eb.where("conflicted", "is", null)
        )
        .$if(this.type === "notes", (eb) =>
          eb.where("conflicted", "is not", true)
        )
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
  private _fields: (
    | AnyColumn<DatabaseSchema, keyof DatabaseSchema>
    | AnyColumnWithTable<DatabaseSchema, keyof DatabaseSchema>
  )[] = [];
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
          eb.$call(
            this.buildSortExpression({ ...sortOptions!, groupBy: "none" })
          )
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
        eb.$call(this.buildSortExpression({ ...sortOptions!, groupBy: "none" }))
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

    if (ids) return Object.fromEntries(ids.map((id) => [id, items[id]]));
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
    sanitizeSortOptions(this.type, options);
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
      (items) => groupArray(items as any, createKeySelector(options)),
      () => this.groups(options)
    );
  }

  async groups(options: GroupOptions) {
    sanitizeSortOptions(this.type, options);

    const fields: Array<
      | AnyColumnWithTable<DatabaseSchema, keyof DatabaseSchema>
      | AnyColumn<DatabaseSchema, keyof DatabaseSchema>
      | AliasedRawBuilder<number, "dueDate">
    > = ["id", "type"];
    if (this.type === "notes") fields.push("notes.pinned", "notes.conflicted");
    else if (this.type === "notebooks") fields.push("notebooks.pinned");
    else if (this.type === "attachments" && options.groupBy === "abc")
      fields.push("attachments.filename");
    else if (this.type === "reminders" || options.sortBy === "dueDate") {
      fields.push(
        "reminders.mode",
        "reminders.snoozeUntil",
        "reminders.disabled",
        "reminders.date",
        createUpcomingReminderTimeQuery().as("dueDate")
      );
    }

    if (options.groupBy === "abc") fields.push("title");
    else if (options.sortBy === "title" && options.groupBy !== "none")
      fields.push("dateCreated");
    else if (options.sortBy !== "dueDate")
      // && options.sortBy !== "relevance")
      fields.push(options.sortBy);

    return Array.from(
      groupArray(
        await this.filter
          .select(fields)
          .$call(this.buildSortExpression(options, true))
          .execute(),
        createKeySelector(options)
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
          .$call(this.buildSortExpression({ ...options, groupBy: "none" }))
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
    const fields = this._fields.slice();
    if (fields.length > 0) {
      if (!fields.find((f) => f.includes(".dateCreated")))
        fields.push("dateCreated");
      if (!fields.find((f) => f.includes(".id"))) fields.push("id");
    }

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
        .$if(fields.length === 0, (eb) => eb.selectAll())
        .$if(fields.length > 0, (eb) => eb.select(fields))
        .execute();
      if (rows.length === 0) break;
      for (const row of rows) {
        yield row as T;
      }

      lastRow = rows[rows.length - 1];
    }
  }

  private buildSortExpression(options: GroupOptions, hasDueDate?: boolean) {
    sanitizeSortOptions(this.type, options);

    const sortBy: Set<SortOptions["sortBy"]> = new Set();
    if (options.groupBy === "abc") sortBy.add("title");
    else if (options.sortBy === "title" && options.groupBy !== "none")
      sortBy.add("dateCreated");
    sortBy.add(options.sortBy);

    return <T>(
      qb: SelectQueryBuilder<DatabaseSchema, keyof DatabaseSchema, T>
    ) => {
      if (this.type === "notes")
        qb = qb.orderBy(sql`IFNULL(conflicted, 0) desc`);
      if (this.type === "notes" || this.type === "notebooks")
        qb = qb.orderBy(sql`IFNULL(pinned, 0) desc`);
      if (this.type === "reminders")
        qb = qb.orderBy(
          (qb) => qb.parens(createIsReminderActiveQuery()),
          "desc"
        );

      for (const item of sortBy) {
        if (item === "title") {
          qb = qb.orderBy(
            options.sortBy !== "title"
              ? sql`substring(ltrim(title, ' \u00a0\r\n\t\v'), 1, 1) COLLATE NOCASE`
              : sql`ltrim(title, ' \u00a0\r\n\t\v') COLLATE NOCASE`,
            options.sortDirection
          );
        } else {
          const timeFormat = isGroupOptions(options)
            ? formats[options.groupBy]
            : null;
          if (!timeFormat || isSortByDate(options)) {
            if (item === "dueDate") {
              if (hasDueDate)
                qb = qb.orderBy(item as any, options.sortDirection);
              else
                qb = qb.orderBy(
                  (qb) => qb.parens(createUpcomingReminderTimeQuery()),
                  options.sortDirection
                );
            } // if (item !== "relevance")
            else qb = qb.orderBy(item, options.sortDirection);
            continue;
          }

          qb = qb.orderBy(
            sql`strftime('${sql.raw(timeFormat)}', ${sql.raw(
              item
            )} / 1000, 'unixepoch', 'localtime')`,
            options.sortDirection
          );
        }
      }
      return qb;
    };
  }
}

function isGroupOptions(
  options: SortOptions | GroupOptions
): options is GroupOptions {
  return "groupBy" in options;
}

function isSortByDate(options: SortOptions | GroupOptions) {
  return (
    options.sortBy === "dateCreated" ||
    options.sortBy === "dateEdited" ||
    options.sortBy === "dateDeleted" ||
    options.sortBy === "dateModified" ||
    options.sortBy === "dateUploaded" ||
    options.sortBy === "dueDate"
  );
}

const BASE_FIELDS: SortOptions["sortBy"][] = ["dateCreated", "dateModified"];
const VALID_SORT_OPTIONS: Record<
  keyof DatabaseSchema,
  SortOptions["sortBy"][]
> = {
  reminders: ["dueDate", "title"],
  tags: ["title"],
  attachments: ["filename", "dateUploaded", "size"],
  colors: ["title"],
  notebooks: ["title", "dateDeleted", "dateEdited"],
  notes: ["title", "dateDeleted", "dateEdited"],

  content: [],
  notehistory: [],
  relations: [],
  sessioncontent: [],
  settings: [],
  shortcuts: [],
  vaults: []
};

function sanitizeSortOptions(type: keyof DatabaseSchema, options: SortOptions) {
  const validFields = [...VALID_SORT_OPTIONS[type], ...BASE_FIELDS];
  if (!validFields.includes(options.sortBy)) options.sortBy = validFields[0];
  return options;
}
