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
  ILogReporter,
  LogLevel,
  LogMessage,
  Logger,
  NoopLogger,
  combineReporters,
  consoleReporter,
  format,
  ILogger
} from "@notesnook/logger";
import { Kysely, Migration, MigrationProvider } from "@streetwriters/kysely";
import { SQLiteOptions, createDatabase } from "./database/index.js";
import { toChunks } from "./utils/array.js";

const WEEK = 86400000 * 7;

// Database logger reporter:
// 1. Log to new key on every instance
// 2. Each key contains logs of a session
// 3. Keep 7 days of logs
// 4. Implement functions for log retrieval & filtering

type SQLiteItem<T> = {
  [P in keyof T]?: T[P] | null;
};

type LogMessageWithDate = LogMessage & { date: string };
export type LogDatabaseSchema = {
  logs: SQLiteItem<LogMessageWithDate>;
};

class NNLogsMigrationProvider implements MigrationProvider {
  async getMigrations(): Promise<Record<string, Migration>> {
    return {
      "1": {
        async up(db) {
          await db.schema
            .createTable("logs")
            .addColumn("timestamp", "integer", (c) => c.notNull())
            .addColumn("message", "text", (c) => c.notNull())
            .addColumn("level", "integer", (c) => c.notNull())
            .addColumn("date", "text")
            .addColumn("scope", "text")
            .addColumn("extras", "text")
            .addColumn("elapsed", "integer")
            .execute();

          await db.schema
            .createIndex("log_timestamp_index")
            .on("logs")
            .column("timestamp")
            .execute();
        }
      }
    };
  }
}

class DatabaseLogReporter {
  writer: DatabaseLogWriter;
  constructor(db: Kysely<LogDatabaseSchema>) {
    this.writer = new DatabaseLogWriter(db);
  }

  write(log: LogMessage) {
    this.writer.push(log);
  }
}

class DatabaseLogWriter {
  private queue: LogMessageWithDate[] = [];
  private hasCleared = false;

  constructor(private readonly db: Kysely<LogDatabaseSchema>) {
    setInterval(
      () => {
        setTimeout(() => {
          if (!this.hasCleared) {
            this.hasCleared = true;
            this.rotate();
          }
          this.flush();
        });
      },
      process.env.NODE_ENV === "test" ? 200 : 10000
    );
  }

  push(message: LogMessage) {
    const date = new Date(message.timestamp);
    (message as LogMessageWithDate).date = `${date.getFullYear()}-${
      date.getMonth() + 1
    }-${date.getDate()}`;
    this.queue.push(message as LogMessageWithDate);
  }

  async flush() {
    if (this.queue.length === 0) return;
    const queueCopy = this.queue.slice();
    this.queue = [];
    for (const chunk of toChunks(queueCopy, 1000)) {
      await this.db.insertInto("logs").values(chunk).execute();
    }
  }

  async rotate() {
    const range = Date.now() - WEEK;
    await this.db.deleteFrom("logs").where("timestamp", "<", range).execute();
  }
}

class DatabaseLogManager {
  constructor(private readonly db: Kysely<LogDatabaseSchema>) {}

  async get() {
    const logs = await this.db
      .selectFrom("logs")
      .select([
        "timestamp",
        "message",
        "level",
        "scope",
        "extras",
        "elapsed",
        "date"
      ])
      .execute();
    const groupedLogs: Record<string, LogMessage[]> = {};

    for (const log of logs) {
      const key = log.date!;
      if (!groupedLogs[key]) groupedLogs[key] = [];
      groupedLogs[key].push(log as LogMessage);
    }

    return Object.keys(groupedLogs)
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
      .map((key) => ({
        key,
        logs: groupedLogs[key]?.sort((a, b) => a.timestamp - b.timestamp)
      }));
  }

  async clear() {
    await this.db.deleteFrom("logs").execute();
  }

  async delete(key: string) {
    await this.db.deleteFrom("logs").where("date", "==", key).execute();
  }

  close() {
    return this.db.destroy();
  }
}

async function initialize(
  options: SQLiteOptions,
  disableConsoleLogs?: boolean
) {
  const db = await createDatabase<LogDatabaseSchema>("notesnook-logs", {
    ...options,
    migrationProvider: new NNLogsMigrationProvider()
  });

  const reporters: ILogReporter[] = [new DatabaseLogReporter(db)];
  if (process.env.NODE_ENV !== "production" && !disableConsoleLogs)
    reporters.push(consoleReporter);
  const instance = new Logger({
    reporter: combineReporters(reporters),
    lastTime: Date.now()
  });
  if (logger instanceof NoopLogger) logger.replaceWith(instance);
  logger = instance;
  logManager = new DatabaseLogManager(db);
}

let logger: ILogger = new NoopLogger();
let logManager: DatabaseLogManager | undefined = undefined;

export { LogLevel, format, initialize, logManager, logger };
