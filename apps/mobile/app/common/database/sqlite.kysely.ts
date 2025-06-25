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
import { QuickSQLiteConnection, open } from "react-native-quick-sqlite";
import { strings } from "@notesnook/intl";

type Config = { dbName: string; async: boolean; location?: string };

export class RNSqliteDriver implements Driver {
  private connection?: DatabaseConnection;
  private connectionMutex = new ConnectionMutex();
  private db: QuickSQLiteConnection;
  constructor(private readonly config: Config) {
    this.db = open({
      name: config.dbName
    });
  }

  async init(): Promise<void> {
    this.connection = new RNSqliteConnection(this.db);
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    // SQLite only has one single connection. We use a mutex here to wait
    // until the single connection has been released.
    await this.connectionMutex.lock();
    return this.connection!;
  }

  async beginTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw("BEGIN TRANSACTION"));
  }

  async commitTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw("COMMIT"));
  }

  async rollbackTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw("ROLLBACK"));
  }

  async releaseConnection(): Promise<void> {
    this.connectionMutex.unlock();
  }

  async destroy(): Promise<void> {
    this.db.close();
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

class RNSqliteConnection implements DatabaseConnection {
  constructor(private readonly db: QuickSQLiteConnection) {}

  streamQuery<R>(): AsyncIterableIterator<QueryResult<R>> {
    throw new Error(strings.streamingNotSupported());
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

    const result = await this.db.executeAsync(sql, parameters as any[]);

    if (mode === "query" || !result.insertId)
      return {
        rows: result.rows?._array || []
      };

    return {
      insertId: BigInt(result.insertId),
      numAffectedRows: BigInt(result.rowsAffected),
      rows: mode === "raw" ? result.rows?._array || [] : []
    };
  }
}
