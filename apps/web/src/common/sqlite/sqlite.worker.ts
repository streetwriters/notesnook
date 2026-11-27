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

import { Factory, SQLITE_ROW, SQLITE_UTF8, SQLiteError } from "wa-sqlite";
import { expose, transfer } from "comlink";
import type { RunMode } from "./type";
import { QueryResult } from "@streetwriters/kysely";
import { DatabaseSource } from "./sqlite-export";
import { createSharedServicePort } from "./shared-service";
import type { FacadeVFS } from "wa-sqlite/src/FacadeVFS.js";
import { rewriteError } from "../../utils/error";

type PreparedStatement = {
  stmt: number;
  columns: string[];
};

type DatabaseVFS = FacadeVFS & {
  close(): void | Promise<void>;
  delete(): Promise<void>;
};

type SQLiteOptions = {
  async: boolean;
  url?: string;
  encrypted: boolean;
};

class _SQLiteWorker {
  sqlite!: SQLiteAPI;
  module: unknown;
  db: number | undefined = undefined;
  vfs: DatabaseVFS | null = null;
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

    this.module = await this.loadModule(options);
    this.sqlite = Factory(this.module);
    this.vfs = await this.getVFS(name, options);

    this.sqlite.vfs_register(this.vfs, false);
    this.db = await this.sqlite.open_v2(
      name,
      undefined,
      `multipleciphers-${this.vfs.name}`
    );

    this.sqlite.create_function(
      this.db,
      "natural_key",
      1,
      SQLITE_UTF8,
      0,
      (context: number, values: Uint32Array) => {
        const val =
          values && values.length > 0 ? this.sqlite.value(values[0]) : null;
        const natural =
          typeof val === "string"
            ? val.replace(/\d+/g, (n) => n.padStart(10, "0"))
            : val;
        this.sqlite.result(context, natural as SQLiteCompatibleType);
      }
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

      let stmt: number | undefined;
      // unscoped keeps the statement alive after the loop so it can be cached
      for await (const prepared of this.sqlite.statements(this.db, sql, {
        unscoped: true
      })) {
        stmt = prepared;
        break;
      }
      if (!stmt) return;

      const statement: PreparedStatement = {
        stmt,
        columns: this.sqlite.column_names(stmt)
      };
      this.preparedStatements.set(sql, statement);

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
        throw rewriteError(e, `${e.message} (error executing query: ${sql})`);
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
    if (!this.encrypted && !this.initialized) await this.initialize();

    if (this.encrypted && !sql.startsWith("PRAGMA key")) {
      await this.waitForDatabase();
    }
    if (!this.db) throw new Error("Database is not opened.");

    if (sql === "rollback" && this.sqlite.get_autocommit(this.db))
      return { rows: [] };

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
    const vfs = this.vfs ?? (await this.getVFS(name, options));
    const stream = new ReadableStream(new DatabaseSource(vfs, name));
    return transfer(stream, [stream]);
  }

  async delete(name: string, options: SQLiteOptions) {
    await this.close();
    if (this.vfs) await this.vfs.delete();
    else {
      const vfs = await this.getVFS(name, options);
      await vfs.close();
      await vfs.delete();
    }
  }

  async loadModule(options: SQLiteOptions) {
    const option = options.url ? { locateFile: () => options.url } : {};
    return options.async
      ? await import("wa-sqlite/dist/wa-sqlite-async.mjs").then(
          ({ default: SQLiteAsyncESMFactory }) => SQLiteAsyncESMFactory(option)
        )
      : await import("wa-sqlite/dist/wa-sqlite.mjs").then(
          ({ default: SQLiteSyncESMFactory }) => SQLiteSyncESMFactory(option)
        );
  }

  async getVFS(dbName: string, options: SQLiteOptions): Promise<DatabaseVFS> {
    // a VFS is bound to the wasm module it is registered with
    const module = this.module ?? (await this.loadModule(options));
    return options.async
      ? await import("wa-sqlite/src/examples/IDBBatchAtomicVFS.js").then(
          ({ IDBBatchAtomicVFS }) =>
            IDBBatchAtomicVFS.create(dbName, module, { lockPolicy: "shared" })
        )
      : await import("wa-sqlite/src/examples/AccessHandlePoolVFS.js").then(
          ({ AccessHandlePoolVFS }) =>
            AccessHandlePoolVFS.create(dbName, module)
        );
  }

  async initialize() {
    if (typeof this.db === "number")
      await this.sqlite.register_extensions(this.db);

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
