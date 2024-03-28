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

import type { DatabaseConnection, Driver, QueryResult } from "kysely";
import { CompiledQuery } from "kysely";
import Worker from "./sqlite.worker.ts?worker";
import type { SQLiteWorker } from "./sqlite.worker";
import SQLiteSyncURI from "./wa-sqlite.wasm?url";
import SQLiteAsyncURI from "./wa-sqlite-async.wasm?url";
import { Mutex } from "async-mutex";
import { SharedService } from "./shared-service";

type Config = { dbName: string; async: boolean; init?: () => Promise<void> };
const SHARED_SERVICE_NAME = "notesnook-sqlite";
export class WaSqliteWorkerDriver implements Driver {
  private connection?: DatabaseConnection;
  private connectionMutex = new ConnectionMutex();
  private worker?: SQLiteWorker;
  constructor(private readonly config: Config) {}

  async init(): Promise<void> {
    const sharedService = new SharedService<SQLiteWorker>(SHARED_SERVICE_NAME);
    sharedService.activate(
      () =>
        new Promise<MessagePort>((resolve) => {
          this.needsInitialization = true;

          const baseWorker = new Worker();
          baseWorker.addEventListener(
            "message",
            (event) => resolve(event.ports[0]),
            { once: true }
          );
          baseWorker.postMessage({
            dbName: this.config.dbName,
            async: this.config.async,
            uri: this.config.async ? SQLiteAsyncURI : SQLiteSyncURI
          });
        })
    );

    console.log("waiting to initialize");
    // we have to wait until a provider becomes available, otherwise
    // a race condition is created where the client starts executing
    // queries before it is initialized.
    await sharedService.getProviderPort();

    this.worker = sharedService.proxy;
    this.connection = new WaSqliteWorkerConnection(this.worker);
  }

  private needsInitialization = false;
  async #initialize() {
    if (this.needsInitialization) {
      this.needsInitialization = false;
      try {
        await this.config.init?.();
      } catch (e) {
        this.needsInitialization = true;
        throw e;
      }
    }
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    await this.#initialize();
    // SQLite only has one single connection. We use a mutex here to wait
    // until the single connection has been released.
    await this.connectionMutex.lock();
    return this.connection!;
  }

  async beginTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw("begin"));
  }

  async commitTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw("commit"));
  }

  async rollbackTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw("rollback"));
  }

  async releaseConnection(): Promise<void> {
    this.connectionMutex.unlock();
  }

  async destroy(): Promise<void> {
    return await this.worker?.close();
  }

  async delete() {
    return this.worker?.delete();
  }

  async export() {
    return this.worker?.export(this.config.dbName, this.config.async);
  }
}

class ConnectionMutex {
  private promise?: Promise<void>;
  private resolve?: () => void;

  async lock(): Promise<void> {
    while (this.promise) {
      await this.promise;
    }

    this.promise = new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  unlock(): void {
    const resolve = this.resolve;

    this.promise = undefined;
    this.resolve = undefined;

    resolve?.();
  }
}

class WaSqliteWorkerConnection implements DatabaseConnection {
  private readonly queryMutex = new Mutex();
  constructor(private readonly worker: SQLiteWorker) {}

  streamQuery<R>(): AsyncIterableIterator<QueryResult<R>> {
    throw new Error("wasqlite driver doesn't support streaming");
  }

  async executeQuery<R>(
    compiledQuery: CompiledQuery<unknown>
  ): Promise<QueryResult<R>> {
    const { parameters, sql, query } = compiledQuery;
    const mode =
      query.kind === "SelectQueryNode"
        ? "query"
        : query.kind === "RawNode"
        ? "raw"
        : "exec";
    return this.queryMutex.runExclusive(() =>
      this.worker.run(mode, sql, parameters as any)
    );
  }
}
