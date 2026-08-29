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

import { wrap } from "comlink";
import type { Remote } from "comlink";
import type {
  SqlDatabase,
  SqliteAdapter,
  SqliteDatabaseFiles,
  SqlParams,
  SqlRow
} from "@notesnook-importer/core";
import SQLiteWorker from "./sqlite.worker?worker";
import { IDBBatchAtomicVFS } from "./IDBBatchAtomicVFS";
import SQLiteAsyncURI from "./wa-sqlite-async.wasm?url";

type ImporterWorkerAPI = {
  open(
    name: string,
    options: { async: boolean; url?: string; encrypted: boolean; skipExtensions?: boolean }
  ): Promise<void>;
  run(
    mode: "query" | "exec" | "raw",
    sql: string,
    parameters?: unknown[]
  ): Promise<{ rows: SqlRow[] }>;
  close(): Promise<void>;
};

function toParams(params?: SqlParams): unknown[] | undefined {
  return Array.isArray(params) ? params : params ? Object.values(params) : undefined;
}

class WorkerSqlDatabase implements SqlDatabase {
  constructor(
    private readonly worker: InstanceType<typeof SQLiteWorker>,
    private readonly api: Remote<ImporterWorkerAPI>,
    private readonly idbName: string
  ) {}

  async all<T = SqlRow>(sql: string, params?: SqlParams): Promise<T[]> {
    const result = await this.api.run("query", sql, toParams(params));
    return result.rows as T[];
  }

  async get<T = SqlRow>(sql: string, params?: SqlParams): Promise<T | undefined> {
    const result = await this.api.run("query", sql, toParams(params));
    return result.rows[0] as T | undefined;
  }

  close() {
    void this.api
      .close()
      .catch(() => {})
      .finally(() => {
        this.worker.terminate();
        try {
          indexedDB.deleteDatabase(this.idbName);
        } catch {
          // ignore
        }
      });
  }
}

/**
 * An SQLite adapter for Apple Notes / Apple Journal. Database files are
 * streamed into IndexedDB (via the `IDBBatchAtomicVFS` block format) on the
 * main thread — so large imports never load the files fully into memory — and
 * the existing `sqlite.worker.ts` is reused to open the database and run
 * queries. WAL data is replayed with exclusive locking, so no manual
 * checkpointing is needed.
 */
export class ImporterSqliteAdapter implements SqliteAdapter {
  async open(files: SqliteDatabaseFiles): Promise<SqlDatabase> {
    const name = `importer-${crypto.randomUUID()}`;
    const path = `/${name}`;

    const vfs = new IDBBatchAtomicVFS(name, { durability: "strict" });
    try {
      await vfs.importFile(path, files.main);
      if (files.wal) await vfs.importFile(`${path}-wal`, files.wal);
      // The -shm file is intentionally skipped: it is only a cache of the WAL
      // index and its import breaks the Asyncify build. Exclusive locking makes
      // SQLite rebuild it in memory.
    } finally {
      await vfs.close();
    }

    const worker = new SQLiteWorker();
    const api = wrap<ImporterWorkerAPI>(worker);
    await api.open(name, {
      async: true,
      encrypted: false,
      url: SQLiteAsyncURI,
      skipExtensions: true
    });

    // WAL + exclusive locking (the same combination the Notesnook database
    // uses) replays the imported -wal file without needing a shared -shm.
    await api.run("exec", "PRAGMA locking_mode=EXCLUSIVE");

    return new WorkerSqlDatabase(worker, api, name);
  }
}
