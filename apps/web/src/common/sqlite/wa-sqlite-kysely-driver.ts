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

import type {
  DatabaseConnection,
  Driver,
  QueryResult
} from "@streetwriters/kysely";
import { CompiledQuery } from "@streetwriters/kysely";
import Worker from "./sqlite.worker.ts?worker";
import type { SQLiteWorker } from "./sqlite.worker";
import SQLiteSyncURI from "./wa-sqlite.wasm?url";
import SQLiteAsyncURI from "./wa-sqlite-async.wasm?url";
import { Mutex } from "async-mutex";
import { SharedService } from "./shared-service";
import { Remote, wrap } from "comlink";

type Config = {
  dbName: string;
  async: boolean;
  encrypted: boolean;
  init?: () => Promise<void>;
};

const servicePool = new Map<
  string,
  { service: SharedService<SQLiteWorker>; activated: boolean; closed: boolean }
>();

export class WaSqliteWorkerMultipleTabDriver implements Driver {
  private connection?: DatabaseConnection;
  private connectionMutex = new Mutex();
  private initializationMutex = new Mutex();
  private readonly serviceName;

  constructor(private readonly config: Config) {
    console.log("multi tab driver", config.dbName);
    this.serviceName = `${config.dbName}-service`;
  }

  async init(): Promise<void> {
    const { service, activated, closed } = servicePool.get(
      this.serviceName
    ) || {
      service: new SharedService<SQLiteWorker>(this.serviceName),
      activated: false,
      closed: true
    };
    if (activated) {
      if (closed) {
        console.log("Already activated. Reinitializing...");
        await service.proxy.open(this.config.dbName, {
          async: this.config.async,
          encrypted: this.config.encrypted,
          url: this.config.async ? SQLiteAsyncURI : SQLiteSyncURI
        });
        this.needsInitialization = true;
        servicePool.set(this.serviceName, {
          service,
          activated: true,
          closed: false
        });
        this.connection = new WaSqliteWorkerConnection(
          service.proxy,
          this.config.async
        );
      }
      return;
    }

    service.activate(
      () =>
        new Promise<{ port: MessagePort; onclose: () => void }>((resolve) => {
          console.log("initializing worker");
          this.needsInitialization = true;

          const worker = new Worker();
          worker.addEventListener(
            "message",
            (event) =>
              resolve({
                port: event.ports[0],
                onclose: () => worker.terminate()
              }),
            { once: true }
          );
          worker.postMessage({
            dbName: this.config.dbName,
            async: this.config.async,
            encrypted: this.config.encrypted,
            uri: this.config.async ? SQLiteAsyncURI : SQLiteSyncURI
          });
        }),
      async () => {
        console.log(
          "new client connected.",
          this.needsInitialization,
          this.initializing
        );
        await this.#initialize();
      }
    );

    console.log("waiting to initialize");
    // we have to wait until a provider becomes available, otherwise
    // a race condition is created where the client starts executing
    // queries before it is initialized.
    console.time("waiting for provider port");
    await service.getProviderPort();
    console.timeEnd("waiting for provider port");

    this.connection = new WaSqliteWorkerConnection(
      service.proxy,
      this.config.async
    );

    servicePool.set(this.serviceName, {
      service,
      activated: true,
      closed: false
    });
  }

  private needsInitialization = false;
  private initializing = false;
  async #initialize() {
    if (this.needsInitialization && !this.initializing) {
      try {
        console.log("Starting initialization...");
        this.initializing = true;
        await this.config.init?.();
        this.needsInitialization = false;
        console.log("Initialization done...");
      } catch (e) {
        console.error(e);
        this.needsInitialization = true;
        throw e;
      } finally {
        this.initializing = false;
        // there can be multiple locks on this mutex
        while (this.initializationMutex.isLocked())
          this.initializationMutex.release();
      }
    }
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    if (!this.connection) throw new Error("Driver not initialized.");
    await this.#initialize();

    // We don't want to create deadlock in cases where database
    // hasn't yet been initialized but another query has already taken
    // the connection.
    // Secondly, we don't want to give any other connection until
    // database has finished initializing.
    await this.initializationMutex.waitForUnlock();
    if (this.initializing) {
      await this.initializationMutex.acquire();
      return this.connection;
    }

    // SQLite only has one single connection. We use a mutex here to wait
    // until the single connection has been released.
    await this.connectionMutex.waitForUnlock();
    await this.connectionMutex.acquire();
    return this.connection;
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
    this.connectionMutex.release();
  }

  async destroy(): Promise<void> {
    const service = servicePool.get(this.serviceName);
    if (!service) return;
    await service.service?.proxy.close();
    service.closed = true;
  }

  async delete() {
    const service = servicePool.get(this.serviceName);
    if (!service || !service.service) return;
    await service.service?.proxy?.delete(this.config.dbName, {
      async: this.config.async,
      encrypted: this.config.encrypted,
      url: this.config.async ? SQLiteAsyncURI : SQLiteSyncURI
    });
    service.closed = true;
  }

  async export() {
    return servicePool
      .get(this.serviceName)
      ?.service?.proxy?.export(this.config.dbName, {
        async: this.config.async,
        encrypted: this.config.encrypted,
        url: this.config.async ? SQLiteAsyncURI : SQLiteSyncURI
      });
  }
}

export class WaSqliteWorkerSingleTabDriver implements Driver {
  private connection?: DatabaseConnection;
  private connectionMutex = new Mutex();
  private readonly worker;

  constructor(private readonly config: Config) {
    console.log("single tab driver", config.dbName);
    this.worker = wrap<SQLiteWorker>(
      new Worker({ name: config.dbName })
    ) 
  }

  async init(): Promise<void> {
    await this.worker.open(this.config.dbName, {
      async: this.config.async,
      encrypted: this.config.encrypted,
      url: this.config.async ? SQLiteAsyncURI : SQLiteSyncURI
    });
    this.connection = new WaSqliteWorkerConnection(
      this.worker,
      this.config.async
    );
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    if (!this.connection) throw new Error("Driver not initialized.");

    // SQLite only has one single connection. We use a mutex here to wait
    // until the single connection has been released.
    await this.connectionMutex.waitForUnlock();
    await this.connectionMutex.acquire();
    return this.connection;
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
    this.connectionMutex.release();
  }

  async destroy(): Promise<void> {
    await this.worker.close();
  }

  async delete() {
    await this.worker.delete(this.config.dbName, {
      async: this.config.async,
      encrypted: this.config.encrypted,
      url: this.config.async ? SQLiteAsyncURI : SQLiteSyncURI
    });
  }

  async export() {
    return await this.worker.export(this.config.dbName, {
      async: this.config.async,
      encrypted: this.config.encrypted,
      url: this.config.async ? SQLiteAsyncURI : SQLiteSyncURI
    });
  }
}

class WaSqliteWorkerConnection implements DatabaseConnection {
  #queryMutex = new Mutex();
  constructor(
    private readonly worker: SQLiteWorker | Remote<SQLiteWorker>,
    private readonly sequential = false
  ) {}

  streamQuery<R>(): AsyncIterableIterator<QueryResult<R>> {
    throw new Error("wasqlite driver doesn't support streaming");
  }

  async executeQuery<R>(
    compiledQuery: CompiledQuery<unknown>
  ): Promise<QueryResult<R>> {
    if (this.sequential) {
      return this.#queryMutex.runExclusive(async () =>
        this.#_executeQuery(compiledQuery)
      );
    }
    return this.#_executeQuery(compiledQuery);
  }

  #_executeQuery<R>(
    compiledQuery: CompiledQuery<unknown>
  ): Promise<QueryResult<R>> {
    const { parameters, sql, query } = compiledQuery;
    const mode =
      query.kind === "SelectQueryNode"
        ? "query"
        : query.kind === "RawNode"
        ? "raw"
        : "exec";
    return this.worker.run(mode, sql, parameters as any) as Promise<
      QueryResult<R>
    >;
  }
}
