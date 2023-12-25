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

import {
  Migrator,
  Kysely,
  sql,
  KyselyPlugin,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
  QueryResult,
  UnknownRow,
  RootOperationNode,
  OperationNodeTransformer,
  ValueNode,
  PrimitiveValueListNode,
  Transaction,
  ColumnType,
  ExpressionBuilder,
  ReferenceExpression,
  Dialect
} from "kysely";
import {
  Attachment,
  Color,
  ContentItem,
  GroupOptions,
  HistorySession,
  ItemType,
  MaybeDeletedItem,
  Note,
  Notebook,
  Relation,
  Reminder,
  SessionContentItem,
  SettingItem,
  Shortcut,
  Tag,
  TrashOrItem,
  ValueOf
} from "../types";
import { NNMigrationProvider } from "./migrations";
import { createTriggers } from "./triggers";

// type FilteredKeys<T, U> = {
//   [P in keyof T]: T[P] extends U ? P : never;
// }[keyof T];
type SQLiteValue<T> = T extends string | number | boolean | Array<number>
  ? T
  : T extends object | Array<any>
  ? ColumnType<T, string, string>
  : never;
export type SQLiteItem<T> = {
  [P in keyof T]?: T[P] | null;
} & { id: string };

export type SQLiteItemWithRowID<T> = SQLiteItem<T> & { rowid?: number };

export interface DatabaseSchema {
  notes: SQLiteItem<TrashOrItem<Note>>;
  content: SQLiteItem<ContentItem>;
  relations: SQLiteItem<Relation>;
  notebooks: SQLiteItem<TrashOrItem<Notebook>>;
  attachments: SQLiteItem<Attachment>;
  tags: SQLiteItem<Tag>;
  colors: SQLiteItem<Color>;
  reminders: SQLiteItem<Reminder>;
  settings: SQLiteItem<SettingItem>;
  notehistory: SQLiteItem<HistorySession>;
  sessioncontent: SQLiteItem<SessionContentItem>;
  shortcuts: SQLiteItem<Shortcut>;
}

export type DatabaseSchemaWithFTS = DatabaseSchema & {
  notes_fts: SQLiteItemWithRowID<{
    notes_fts: string;
    title: string;
    rank: number;
  }>;
  content_fts: SQLiteItemWithRowID<{
    content_fts: string;
    data: string;
    rank: number;
    noteId: string;
  }>;
};

type AsyncOrSyncResult<Async extends boolean, Response> = Async extends true
  ? Promise<Response>
  : Response;

export interface DatabaseCollection<T, IsAsync extends boolean> {
  clear(): Promise<void>;
  init(): Promise<void>;
  upsert(item: T): Promise<void>;
  softDelete(ids: string[]): Promise<void>;
  delete(ids: string[]): Promise<void>;
  exists(id: string): AsyncOrSyncResult<IsAsync, boolean>;
  count(): AsyncOrSyncResult<IsAsync, number>;
  get(id: string): AsyncOrSyncResult<IsAsync, T | undefined>;
  put(items: (T | undefined)[]): Promise<void>;
  update(ids: string[], partial: Partial<T>): Promise<void>;
  ids(options: GroupOptions): AsyncOrSyncResult<IsAsync, string[]>;
  records(
    ids: string[]
  ): AsyncOrSyncResult<
    IsAsync,
    Record<string, MaybeDeletedItem<T> | undefined>
  >;
  unsynced(
    chunkSize: number,
    forceSync?: boolean
  ): IsAsync extends true
    ? AsyncIterableIterator<MaybeDeletedItem<T>[]>
    : IterableIterator<MaybeDeletedItem<T>[]>;
  stream(
    chunkSize: number
  ): IsAsync extends true ? AsyncIterableIterator<T> : IterableIterator<T>;
}

export type DatabaseAccessor = () =>
  | Kysely<DatabaseSchema>
  | Transaction<DatabaseSchema>;

type FilterBooleanProperties<T, Type> = keyof {
  [K in keyof T as T[K] extends Type ? K : never]: T[K];
};

type BooleanFields = ValueOf<{
  [D in keyof DatabaseSchema]: FilterBooleanProperties<
    DatabaseSchema[D],
    boolean | undefined | null
  >;
}>;

// type ObjectFields = ValueOf<{
//   [D in keyof DatabaseSchema]: FilterBooleanProperties<
//     DatabaseSchema[D],
//     object | undefined | null
//   >;
// }>;

const BooleanProperties: Set<BooleanFields> = new Set([
  "compressed",
  "deleted",
  "disabled",
  "favorite",
  "localOnly",
  "locked",
  "migrated",
  "pinned",
  "readonly",
  "remote",
  "synced"
]);

const DataMappers: Partial<Record<ItemType, (row: any) => void>> = {
  note: (row) => {
    row.conflicted = row.conflicted === 1;
  },
  reminder: (row) => {
    if (row.selectedDays) row.selectedDays = JSON.parse(row.selectedDays);
  },
  settingitem: (row) => {
    if (
      row.value &&
      (row.key.startsWith("groupOptions") ||
        row.key.startsWith("toolbarConfig"))
    )
      row.value = JSON.parse(row.value);
  },
  tiptap: (row) => {
    if (row.conflicted) row.conflicted = JSON.parse(row.conflicted);
    if (row.locked && row.data) row.data = JSON.parse(row.data);
  },
  sessioncontent: (row) => {
    if (row.locked && row.data) row.data = JSON.parse(row.data);
  },
  attachment: (row) => {
    if (row.key) row.key = JSON.parse(row.key);
  }
};

export type SQLiteOptions = {
  dialect: (name: string) => Dialect;
  journalMode?: "WAL" | "MEMORY" | "OFF" | "PERSIST" | "TRUNCATE" | "DELETE";
  synchronous?: "normal" | "extra" | "full" | "off";
  lockingMode?: "normal" | "exclusive";
  tempStore?: "memory" | "file" | "default";
  cacheSize?: number;
  pageSize?: number;
};
export async function createDatabase(name: string, options: SQLiteOptions) {
  const db = new Kysely<DatabaseSchemaWithFTS>({
    dialect: options.dialect(name),
    plugins: [new SqliteBooleanPlugin()]
  });

  const migrator = new Migrator({
    db,
    provider: new NNMigrationProvider()
  });

  await sql`PRAGMA journal_mode = ${sql.raw(
    options.journalMode || "WAL"
  )}`.execute(db);

  await sql`PRAGMA synchronous = ${sql.raw(
    options.synchronous || "normal"
  )}`.execute(db);

  // recursive_triggers are required so that SQLite fires DELETE trigger on
  // REPLACE INTO statements
  await sql`PRAGMA recursive_triggers = true`.execute(db);

  if (options.pageSize)
    await sql`PRAGMA page_size = ${sql.raw(
      options.pageSize.toString()
    )}`.execute(db);

  if (options.tempStore)
    await sql`PRAGMA temp_store = ${sql.raw(options.tempStore)}`.execute(db);

  if (options.cacheSize)
    await sql`PRAGMA cache_size = ${sql.raw(
      options.cacheSize.toString()
    )}`.execute(db);

  if (options.lockingMode)
    await sql`PRAGMA locking_mode = ${sql.raw(options.lockingMode)}`.execute(
      db
    );

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === "Error")
      console.error(`failed to execute migration "${it.migrationName}"`);
  });

  if (error) {
    console.error("failed to run `migrateToLatest`");
    console.error(error);
  }

  await createTriggers(db);

  return db;
}

export function isFalse<TB extends keyof DatabaseSchema>(
  column: ReferenceExpression<DatabaseSchema, TB>
) {
  return (eb: ExpressionBuilder<DatabaseSchema, TB>) =>
    eb.or([eb(column, "is", eb.lit(null)), eb(column, "==", eb.lit(0))]);
}

export class SqliteBooleanPlugin implements KyselyPlugin {
  readonly #transformer = new SqliteBooleanTransformer();

  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    return this.#transformer.transformNode(args.node);
  }

  transformResult(
    args: PluginTransformResultArgs
  ): Promise<QueryResult<UnknownRow>> {
    for (const row of args.result.rows) {
      if (typeof row !== "object") continue;

      for (const key in row) {
        if (BooleanProperties.has(key as BooleanFields)) {
          row[key] = row[key] === 1;
        }
      }

      const mapper = DataMappers[row.type as ItemType];
      if (row.type && mapper) {
        mapper(row);
      }
    }
    return Promise.resolve(args.result);
  }
}

class SqliteBooleanTransformer extends OperationNodeTransformer {
  transformValue(node: ValueNode): ValueNode {
    return {
      ...super.transformValue(node),
      value: this.serialize(node.value)
    };
  }

  protected transformPrimitiveValueList(
    node: PrimitiveValueListNode
  ): PrimitiveValueListNode {
    return {
      ...super.transformPrimitiveValueList(node),
      values: node.values.map((value) => this.serialize(value))
    };
  }

  private serialize(value: unknown) {
    return typeof value === "boolean"
      ? value
        ? 1
        : 0
      : typeof value === "object" && value !== null
      ? JSON.stringify(value)
      : value;
  }
}
