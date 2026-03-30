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
  Dialect,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
  DatabaseConnection,
  QueryResult,
  CompiledQuery,
  Driver
} from "@streetwriters/kysely";
import { desktop } from "../desktop-bridge";
import { Mutex } from "async-mutex";
import { DialectOptions } from ".";

class SqliteDriver implements Driver {
  connection?: DatabaseConnection;
  private connectionMutex = new Mutex();
  private handle?: string;
  constructor(private readonly config: { name: string }) {}

  async init(): Promise<void> {
    this.handle = await desktop!.sqlite.open.mutate({
      filePath: this.config.name
    });
    this.connection = new SqliteWorkerConnection(this.handle);
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
    if (!this.handle) return;
    await desktop!.sqlite.close.mutate({ id: this.handle });
  }

  async delete() {
    if (!this.handle) return;
    await desktop!.sqlite.delete.mutate({ id: this.handle });
  }
}

class SqliteWorkerConnection implements DatabaseConnection {
  constructor(private readonly handle: string) {}

  streamQuery<R>(): AsyncIterableIterator<QueryResult<R>> {
    throw new Error("wasqlite driver doesn't support streaming");
  }

  async executeQuery<R>(
    compiledQuery: CompiledQuery<unknown>
  ): Promise<QueryResult<R>> {
    const { parameters, sql } = compiledQuery;
    return (await desktop!.sqlite.run.mutate({
      id: this.handle,
      sql,
      parameters: parameters as any
    })) as unknown as QueryResult<R>;
  }
}

export const createDialect = (options: DialectOptions): Dialect => {
  return {
    createDriver: () =>
      new SqliteDriver({
        name: options.name
      }),
    createAdapter: () => new SqliteAdapter(),
    createIntrospector: (db) => new SqliteIntrospector(db),
    createQueryCompiler: () => new SqliteQueryCompiler()
  };
};
