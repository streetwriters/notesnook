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
  Logger,
  combineReporters,
  consoleReporter,
  format,
  LogLevel,
  NoopLogger,
  LogMessage,
  ILogReporter,
  ILogger
} from "@notesnook/logger";
import { IStorage } from "./interfaces";

// Database logger reporter:
// 1. Log to new key on every instance
// 2. Each key contains logs of a session
// 3. Keep 14 days of logs
// 4. Implement functions for log retrieval & filtering

const MAX_RETENTION_LENGTH = 14;

class DatabaseLogReporter {
  private readonly writer: DatabaseLogWriter;
  constructor(storage: IStorage) {
    this.writer = new DatabaseLogWriter(storage);
  }

  write(log: LogMessage) {
    this.writer.push(log);
  }
}

class DatabaseLogWriter {
  private queue: LogMessage[];
  private readonly key: string;

  constructor(private readonly storage: IStorage) {
    this.key = new Date().toLocaleDateString();
    this.queue = [];

    setInterval(() => {
      setTimeout(() => this.flush());
    }, 2000);
  }

  push(message: LogMessage) {
    this.queue.push(message);
  }

  async read() {
    return (await this.storage.read<LogMessage[]>(this.key, true)) || [];
  }

  async flush() {
    if (this.queue.length <= 0) return;
    const queueCopy = this.queue.slice();
    this.queue = [];

    let logs = await this.read();
    if (!logs) {
      await this.rotate();
      logs = await this.read();
    }

    logs.push(...queueCopy);
    await this.storage.write(this.key, logs);
  }

  async rotate() {
    await this.storage.write(this.key, []);
    const logKeys = (await this.storage.getAllKeys()).sort();

    if (logKeys.length > MAX_RETENTION_LENGTH) {
      for (const key of logKeys.slice(
        0,
        logKeys.length - MAX_RETENTION_LENGTH
      )) {
        await this.storage.remove(key);
      }
    }
  }
}

class DatabaseLogManager {
  constructor(private readonly storage: IStorage) {}

  async get() {
    const logKeys = await this.storage.getAllKeys();
    const logs = [];
    for (const key of logKeys) {
      const log = await this.storage.read(key, true);
      logs.push({ key, logs: log });
    }
    return logs;
  }

  async clear() {
    const logKeys = await this.storage.getAllKeys();
    for (const key of logKeys) {
      await this.storage.remove(key);
    }
  }

  async delete(key: string) {
    await this.storage.remove(key);
  }
}

function initalize(storage: IStorage, disableConsoleLogs = false) {
  if (storage) {
    const reporters: ILogReporter[] = [new DatabaseLogReporter(storage)];
    if (process.env.NODE_ENV !== "production" && !disableConsoleLogs)
      reporters.push(consoleReporter);
    logger = new Logger({
      reporter: combineReporters(reporters),
      lastTime: Date.now()
    });
    logManager = new DatabaseLogManager(storage);
  }
}

let logger: ILogger = new NoopLogger();
let logManager: DatabaseLogManager | undefined;

export { logger, logManager, initalize, format, LogLevel };
