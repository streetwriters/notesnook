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
import { Factory, SQLITE_ROW, SQLiteError } from "./sqlite-api";
import { expose, transfer } from "comlink";
import type { RunMode } from "./type";
import { QueryResult } from "@streetwriters/kysely";
import { DatabaseSource } from "./sqlite-export";
import { createSharedServicePort } from "./shared-service";
import type { IDBBatchAtomicVFS } from "./IDBBatchAtomicVFS";
import type { AccessHandlePoolVFS } from "./AccessHandlePoolVFS";

type PreparedStatement = {
  stmt: number;
  columns: string[];
};

type SQLiteOptions = {
  async: boolean;
  url?: string;
  encrypted: boolean;
};

class _SQLiteWorker {
  sqlite!: SQLiteAPI;
  db: number | undefined = undefined;
  vfs: IDBBatchAtomicVFS | AccessHandlePoolVFS | null = null;
  initialized = false;
  preparedStatements: Map<string, PreparedStatement> = new Map();
  retryCounter: Record<string, number> = {};
  encrypted = false;
  name = "";
  async = false;

  async open(name: string, options: SQLiteOptions) {
    if (this.db) {
      console.error("Database is already initialized", this.db);
      return;
    }

    this.encrypted = options.encrypted;
    this.name = name;
    this.async = options.async;

    const option = options.url ? { locateFile: () => options.url } : {};
    const sqliteModule = options.async
      ? await import("./wa-sqlite-async").then(
          ({ default: SQLiteAsyncESMFactory }) => SQLiteAsyncESMFactory(option)
        )
      : await import("./wa-sqlite").then(({ default: SQLiteSyncESMFactory }) =>
          SQLiteSyncESMFactory(option)
        );
    this.sqlite = Factory(sqliteModule);
    this.vfs = await this.getVFS(name, options.async);

    this.sqlite.vfs_register(this.vfs, false);
    this.db = await this.sqlite.open_v2(
      name,
      undefined,
      `multipleciphers-${this.vfs.name}`
    );
  }

  /**
   * Wrapper function for preparing SQL statements with caching
   * to avoid unnecessary computations.
   */
  async prepare(sql: string): Promise<PreparedStatement | undefined> {
    if (!this.db) throw new Error("Database is not initialized.");
    try {
      const cached = this.preparedStatements.get(sql);
      if (cached !== undefined) return cached;

      const str = this.sqlite.str_new(this.db, sql);
      const prepared = await this.sqlite.prepare_v2(
        this.db,
        this.sqlite.str_value(str)
      );
      if (!prepared) return;

      const statement: PreparedStatement = {
        stmt: prepared.stmt,
        columns: this.sqlite.column_names(prepared.stmt)
      };
      this.preparedStatements.set(sql, statement);

      this.sqlite.str_finish(str);

      // reset retry count on success
      this.retryCounter[sql] = 0;
      return statement;
    } catch (ex) {
      console.error(ex);

      // statement prepare process can be flaky so retry at least 5 times
      // before giving up.
      if (this.retryCounter[sql] < 5) {
        this.retryCounter[sql] = (this.retryCounter[sql] || 0) + 1;
        console.warn("Failed to prepare statement. Retrying:", sql);
        return this.prepare(sql);
      } else this.retryCounter[sql] = 0;

      if (ex instanceof Error || ex instanceof SQLiteError)
        ex.message += ` (error preparing query: ${sql})`;
      throw ex;
    }
  }

  async exec(sql: string, mode: RunMode, parameters?: SQLiteCompatibleType[]) {
    const prepared = await this.prepare(sql);
    if (!prepared) return [];
    try {
      if (parameters) this.sqlite.bind_collection(prepared.stmt, parameters);

      // fast path for exec statements
      if (mode === "exec") {
        while ((await this.sqlite.step(prepared.stmt)) === SQLITE_ROW);
        return [];
      }

      const rows: Record<string, SQLiteCompatibleType>[] = [];
      while ((await this.sqlite.step(prepared.stmt)) === SQLITE_ROW) {
        const row = this.sqlite.row(prepared.stmt);
        const acc: Record<string, SQLiteCompatibleType> = {};
        row.forEach((v, i) => (acc[prepared.columns[i]] = v));
        rows.push(acc);
      }

      return rows;
    } catch (e) {
      if (e instanceof Error || e instanceof SQLiteError)
        e.message += ` (error exec query: ${sql})`;
      throw e;
    } finally {
      await this.sqlite
        .reset(prepared.stmt)
        // we must clear/destruct the prepared statement if it can't be reset
        .catch(() =>
          this.sqlite
            .finalize(prepared.stmt)
            // ignore error (we will just prepare a new statement)
            .catch(console.error)
            .finally(() => this.preparedStatements.delete(sql))
        );
    }
  }

  async run<R>(
    mode: RunMode,
    sql: string,
    parameters?: SQLiteCompatibleType[]
  ): Promise<QueryResult<R>> {
    if (this.encrypted && !sql.startsWith("PRAGMA key")) {
      await this.waitForDatabase();
    }
    if (!this.db) throw new Error("Database is not opened.");

    const rows = (await this.exec(sql, mode, parameters)) as R[];
    if (mode === "query") return { rows };

    // initialize the database after it has been successfully decrypted.
    // all queries prior to that must wait otherwise we get the
    // "file is not a database" error
    if (this.encrypted && sql.startsWith("PRAGMA key")) await this.initialize();

    return {
      insertId: BigInt(this.sqlite.last_insert_rowid(this.db)),
      numAffectedRows: BigInt(this.sqlite.changes(this.db)),
      rows: mode === "raw" ? rows : []
    };
  }

  async close() {
    if (!this.db) return;

    for (const [_, prepared] of this.preparedStatements) {
      await this.sqlite.finalize(prepared.stmt);
    }
    this.preparedStatements.clear();
    await this.sqlite.close(this.db);
    await this.vfs?.close();

    this.db = undefined;
    this.initialized = false;
  }

  async export(name: string, options: SQLiteOptions) {
    const vfs = await this.getVFS(name, options.async);
    const stream = new ReadableStream(new DatabaseSource(vfs, name));
    return transfer(stream, [stream]);
  }

  async delete(name: string, options: SQLiteOptions) {
    await this.close();
    if (this.vfs) await this.vfs.delete();
    else await (await this.getVFS(name, options.async)).delete();
  }

  async getVFS(dbName: string, async: boolean) {
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

  async initialize() {
    self.dispatchEvent(
      new MessageEvent("message", {
        data: { type: "databaseInitialized", dbName: this.name }
      })
    );
    console.log("Database initialized", this.db);
    this.initialized = true;
  }

  async waitForDatabase() {
    // if the database hasn't yet been initialized.
    if (!this.initialized) {
      console.log("Waiting for database to be initialized...", this.db);
      return await new Promise<boolean>((resolve) =>
        self.addEventListener("message", (ev) => {
          if (
            ev.data.type === "databaseInitialized" &&
            ev.data.dbName === this.name
          )
            resolve(true);
        })
      );
    }
    return true;
  }
}

export type SQLiteWorker = typeof _SQLiteWorker.prototype;

addEventListener("message", async (event) => {
  if (!event.data.type) {
    const worker = new _SQLiteWorker();
    await worker.open(event.data.dbName, {
      async: event.data.async,
      encrypted: event.data.encrypted,
      url: event.data.uri
    });
    const providerPort = createSharedServicePort(worker);
    postMessage(null, [providerPort]);

    self.addEventListener("beforeunload", () => worker.close());
  }
});
const worker = new _SQLiteWorker();
expose(worker);
