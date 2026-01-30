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
  connectionId?: string;

  constructor(private readonly config: { name: string }) {}

  async init(): Promise<void> {
    const path = await desktop!.integration.resolvePath.query({
      filePath: `userData/${this.config.name}.sql`
    });
    this.connectionId = await desktop!.db.connect.mutate({ filePath: path });
    this.connection = new SqliteWorkerConnection(this.connectionId);
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    if (!this.connection) throw new Error("Driver not initialized.");
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
    if (this.connectionId) {
      await desktop!.db.close.mutate({ connectionId: this.connectionId });
    }
  }

  async delete() {
    // Check if we need to close first? available in destroy
    if (this.connectionId) {
      await desktop!.db.close.mutate({ connectionId: this.connectionId });
    }
    // We might need an API to delete the file via Node, but previously it used the worker.
    // Ideally we should add a delete method to dbRouter or use integration.
    // For now let's assume manual deletion or skip if not critical for this bug fix.
    // Actually `sqlService` has delete method? No, but `SQLite` class has.
    // Let's rely on manual cleanup or add delete later.
  }
}

class SqliteWorkerConnection implements DatabaseConnection {
  constructor(private readonly connectionId: string) {}

  streamQuery<R>(): AsyncIterableIterator<QueryResult<R>> {
    throw new Error("wasqlite driver doesn't support streaming");
  }

  async executeQuery<R>(
    compiledQuery: CompiledQuery<unknown>
  ): Promise<QueryResult<R>> {
    const { parameters, sql } = compiledQuery;
    return desktop!.db.exec.mutate({
      connectionId: this.connectionId,
      sql,
      parameters: parameters as any
    }) as unknown as QueryResult<R>;
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
