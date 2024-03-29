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

import type { SQLiteAPI, SQLiteCompatibleType } from "./sqlite-types";
import { Factory, SQLITE_ROW } from "./sqlite-api";
import { transfer } from "comlink";
import type { RunMode } from "./type";
import { QueryResult } from "kysely";
import { DatabaseSource } from "./sqlite-export";
import { createSharedServicePort } from "./shared-service";
import type { IDBBatchAtomicVFS } from "./IDBBatchAtomicVFS";
import type { AccessHandlePoolVFS } from "./AccessHandlePoolVFS";

type PreparedStatement = {
  stmt: number;
  columns: string[];
};

let sqlite: SQLiteAPI;
let db: number | undefined = undefined;
let vfs: IDBBatchAtomicVFS | AccessHandlePoolVFS | null = null;
let initialized = false;
const preparedStatements: Map<string, PreparedStatement> = new Map();
const retryCounter: Record<string, number> = {};
console.log("new sqlite worker");

async function open(dbName: string, async: boolean, url?: string) {
  if (db) {
    console.error("Database is already initialized", db);
    return;
  }

  const option = url ? { locateFile: () => url } : {};
  const sqliteModule = async
    ? await import("./wa-sqlite-async").then(
        ({ default: SQLiteAsyncESMFactory }) => SQLiteAsyncESMFactory(option)
      )
    : await import("./wa-sqlite").then(({ default: SQLiteSyncESMFactory }) =>
        SQLiteSyncESMFactory(option)
      );
  sqlite = Factory(sqliteModule);
  vfs = await getVFS(dbName, async);

  sqlite.vfs_register(vfs, false);
  db = await sqlite.open_v2(dbName, undefined, `multipleciphers-${vfs.name}`);
}

/**
 * Wrapper function for preparing SQL statements with caching
 * to avoid unnecessary computations.
 */
async function prepare(sql: string) {
  if (!db) throw new Error("Database is not initialized.");
  try {
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

    sqlite.str_finish(str);

    // reset retry count on success
    retryCounter[sql] = 0;
    return statement;
  } catch (ex) {
    console.error(ex);

    // statement prepare process can be flaky so retry at least 5 times
    // before giving up.
    if (retryCounter[sql] < 5) {
      retryCounter[sql] = (retryCounter[sql] || 0) + 1;
      console.warn("Failed to prepare statement. Retrying:", sql);
      return prepare(sql);
    } else retryCounter[sql] = 0;

    throw ex;
  }
}

async function run(
  sql: string,
  mode: RunMode,
  parameters?: SQLiteCompatibleType[]
) {
  const prepared = await prepare(sql);
  if (!prepared) return [];
  try {
    if (parameters) sqlite.bind_collection(prepared.stmt, parameters);

    // fast path for exec statements
    if (mode === "exec") {
      while ((await sqlite.step(prepared.stmt)) === SQLITE_ROW);
      return [];
    }

    const rows: Record<string, SQLiteCompatibleType>[] = [];
    while ((await sqlite.step(prepared.stmt)) === SQLITE_ROW) {
      const row = sqlite.row(prepared.stmt);
      const acc: Record<string, SQLiteCompatibleType> = {};
      row.forEach((v, i) => (acc[prepared.columns[i]] = v));
      rows.push(acc);
    }

    return rows;
  } finally {
    await sqlite
      .reset(prepared.stmt)
      // we must clear/destruct the prepared statement if it can't be reset
      .catch(() =>
        sqlite
          .finalize(prepared.stmt)
          // ignore error (we will just prepare a new statement)
          .catch(console.error)
          .finally(() => preparedStatements.delete(sql))
      );
  }
}

async function exec<R>(
  mode: RunMode,
  sql: string,
  parameters?: SQLiteCompatibleType[]
): Promise<QueryResult<R>> {
  if (!sql.startsWith("PRAGMA key")) {
    await waitForDatabase();
  }
  if (!db) throw new Error("No database is not opened.");

  const rows = (await run(sql, mode, parameters)) as R[];
  if (mode === "query") return { rows };

  // initialize the database after it has been successfully decrypted.
  // all queries prior to that must wait otherwise we get the
  // "file is not a database" error
  if (sql.startsWith("PRAGMA key")) await initialize();

  return {
    insertId: BigInt(sqlite.last_insert_rowid(db)),
    numAffectedRows: BigInt(sqlite.changes(db)),
    rows: mode === "raw" ? rows : []
  };
}

async function close() {
  if (!db) return;

  for (const [_, prepared] of preparedStatements) {
    await sqlite.finalize(prepared.stmt);
  }
  preparedStatements.clear();
  await sqlite.close(db);
  await vfs?.close();

  db = undefined;
  initialized = false;
}

async function exportDatabase(dbName: string, async: boolean) {
  const vfs = await getVFS(dbName, async);
  const stream = new ReadableStream(new DatabaseSource(vfs, dbName));
  return transfer(stream, [stream]);
}

async function deleteDatabase(dbName: string, async: boolean) {
  await close();
  if (vfs) await vfs.delete();
  else await (await getVFS(dbName, async)).delete();
}

async function getVFS(dbName: string, async: boolean) {
  const vfs = async
    ? await import("./IDBBatchAtomicVFS").then(
        ({ IDBBatchAtomicVFS }) =>
          new IDBBatchAtomicVFS(dbName, { durability: "strict" })
      )
    : await import("./AccessHandlePoolVFS").then(
        ({ AccessHandlePoolVFS }) => new AccessHandlePoolVFS(dbName)
      );
  if ("isReady" in vfs) await vfs.isReady;
  return vfs;
}

async function initialize() {
  self.dispatchEvent(
    new MessageEvent("message", { data: { type: "databaseInitialized" } })
  );
  console.log("Database initialized", db);
  initialized = true;
}

const worker = {
  close,
  open,
  run: exec,
  export: exportDatabase,
  delete: deleteDatabase
};

export type SQLiteWorker = typeof worker;

addEventListener("message", async (event) => {
  if (!event.data.type) {
    await worker.open(event.data.dbName, event.data.async, event.data.uri);
    const providerPort = createSharedServicePort(worker);
    postMessage(null, [providerPort]);
  }
});

async function waitForDatabase() {
  // if the database hasn't yet been initialized.
  if (!initialized) {
    console.log("Waiting for database to be initialized...", db);
    return await new Promise<boolean>((resolve) =>
      self.addEventListener("message", (ev) => {
        if (ev.data.type === "databaseInitialized") resolve(true);
      })
    );
  }
  return true;
}
