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

// import type { SQLiteAPI, SQLiteCompatibleType } from "./index.d.ts";
import { Factory, SQLITE_ROW } from "./sqlite-api";
import SQLiteAsyncESMFactory from "./wa-sqlite-async";
import SQLiteSyncESMFactory from "./wa-sqlite";
import { IDBBatchAtomicVFS } from "./IDBBatchAtomicVFS";
import { AccessHandlePoolVFS } from "./AccessHandlePoolVFS";
import { expose } from "comlink";
import type { RunMode } from "./type";
import { QueryResult } from "kysely";

type PreparedStatement = {
  stmt: number;
  columns: string[];
};

let sqlite: SQLiteAPI;
let db: number;
let vfs: IDBBatchAtomicVFS | AccessHandlePoolVFS | null = null;
const preparedStatements: Map<string, PreparedStatement> = new Map();

async function init(dbName: string, async: boolean, url?: string) {
  const option = url ? { locateFile: () => url } : {};
  const SQLiteAsyncModule = async
    ? await SQLiteAsyncESMFactory(option)
    : await SQLiteSyncESMFactory(option);
  sqlite = Factory(SQLiteAsyncModule);
  vfs = async
    ? new IDBBatchAtomicVFS(dbName, { durability: "strict" })
    : new AccessHandlePoolVFS(dbName);
  if ("isReady" in vfs) await vfs.isReady;

  sqlite.vfs_register(vfs, true);
  db = await sqlite.open_v2(dbName); //, undefined, dbName);
}

/**
 * Wrapper function for preparing SQL statements with caching
 * to avoid unnecessary computations.
 */
async function prepare(sql: string) {
  const cached = preparedStatements.get(sql);
  if (cached !== undefined) return cached;

  const str = sqlite.str_new(db, sql);
  const prepared = await sqlite.prepare_v2(db, sqlite.str_value(str));
  if (!prepared) return;

  const statement: PreparedStatement = {
    stmt: prepared.stmt,
    columns: sqlite.column_names(prepared.stmt)
  };
  preparedStatements.set(sql, statement);
  return statement;
}

async function run(sql: string, parameters?: SQLiteCompatibleType[]) {
  const prepared = await prepare(sql);
  if (!prepared) return [];
  try {
    if (parameters) sqlite.bind_collection(prepared.stmt, parameters);

    const rows: Record<string, SQLiteCompatibleType>[] = [];
    while ((await sqlite.step(prepared.stmt)) === SQLITE_ROW) {
      const row = sqlite.row(prepared.stmt);
      const acc: Record<string, SQLiteCompatibleType> = {};
      row.forEach((v, i) => (acc[prepared.columns[i]] = v));
      rows.push(acc);
    }

    return rows;
  } catch (e) {
    console.error(e);
  } finally {
    await sqlite
      .reset(prepared.stmt)
      // we must clear/destruct the prepared statement if it can't be reset
      .catch(() =>
        sqlite
          .finalize(prepared.stmt)
          // ignore error (we will just prepare a new statement)
          .catch(() => false)
          .finally(() => preparedStatements.delete(sql))
      );
  }
  return [];
}

async function exec<R>(
  mode: RunMode,
  sql: string,
  parameters?: SQLiteCompatibleType[]
): Promise<QueryResult<R>> {
  console.time(sql);
  const rows = (await run(sql, parameters)) as R[];
  console.timeEnd(sql);
  if (mode === "query") return { rows };

  const v = await run("SELECT last_insert_rowid() as id");
  return {
    insertId: BigInt(v[0].id as number),
    numAffectedRows: BigInt(sqlite.changes(db)),
    rows: mode === "raw" ? rows : []
  };
}

async function close() {
  for (const [_, prepared] of preparedStatements) {
    await sqlite.finalize(prepared.stmt);
  }
  await sqlite.close(db);
  await vfs?.close();
}

const worker = {
  close,
  init,
  run: exec
};

export type SQLiteWorker = typeof worker;
expose(worker);
