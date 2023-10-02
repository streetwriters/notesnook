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
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
  sql,
  Driver,
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
  ColumnType
} from "kysely";
import {
  Attachment,
  Color,
  ContentItem,
  HistorySession,
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

export interface DatabaseSchema {
  notes: SQLiteItem<TrashOrItem<Note>>; //| SQLiteItem<BaseTrashItem<Note>>;
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

type AsyncOrSyncResult<Async extends boolean, Response> = Async extends true
  ? Promise<Response>
  : Response;

export interface DatabaseCollection<T, Async extends boolean> {
  clear(): Promise<void>;
  init(): Promise<void>;
  upsert(item: T): Promise<void>;
  softDelete(ids: string[]): Promise<void>;
  delete(ids: string[]): Promise<void>;
  exists(id: string): AsyncOrSyncResult<Async, boolean>;
  count(): AsyncOrSyncResult<Async, number>;
  get(id: string): AsyncOrSyncResult<Async, T | undefined>;
  put(items: (T | undefined)[]): Promise<void>;
  update(ids: string[], partial: Partial<T>): Promise<void>;
}

export type DatabaseAccessor = () =>
  | Kysely<DatabaseSchema>
  | Transaction<DatabaseSchema>;

type FilterBooleanProperties<T> = keyof {
  [K in keyof T as T[K] extends boolean | undefined | null ? K : never]: T[K];
};

type BooleanFields = ValueOf<{
  [D in keyof DatabaseSchema]: FilterBooleanProperties<DatabaseSchema[D]>;
}>;

const BooleanProperties: BooleanFields[] = [
  "compressed",
  "conflicted",
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
];

export async function createDatabase(driver: Driver) {
  const db = new Kysely<DatabaseSchema>({
    dialect: {
      createAdapter: () => new SqliteAdapter(),
      createDriver: () => driver,
      createIntrospector: (db) => new SqliteIntrospector(db),
      createQueryCompiler: () => new SqliteQueryCompiler()
    },
    plugins: [new SqliteBooleanPlugin()]
  });

  const migrator = new Migrator({
    db,
    provider: new NNMigrationProvider()
  });

  await sql`PRAGMA journal_mode = WAL`.execute(db);
  await sql`PRAGMA synchronous = normal`.execute(db);

  await migrator.migrateToLatest();

  return db;
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
      for (const key of BooleanProperties) {
        const value = row[key];
        row[key] = value === 1 ? true : false;
      }
    }
    return Promise.resolve(args.result);
  }
}

class SqliteBooleanTransformer extends OperationNodeTransformer {
  transformValue(node: ValueNode): ValueNode {
    return {
      ...super.transformValue(node),
      value: typeof node.value === "boolean" ? (node.value ? 1 : 0) : node.value
    };
  }

  protected transformPrimitiveValueList(
    node: PrimitiveValueListNode
  ): PrimitiveValueListNode {
    return {
      ...super.transformPrimitiveValueList(node),
      values: node.values.map((value) =>
        typeof value === "boolean" ? (value ? 1 : 0) : value
      )
    };
  }
}
