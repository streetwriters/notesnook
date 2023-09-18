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
import { IStorage } from "./interfaces";

const WEEK = 86400000 * 7;

// Database logger reporter:
// 1. Log to new key on every instance
// 2. Each key contains logs of a session
// 3. Keep 7 days of logs
// 4. Implement functions for log retrieval & filtering

class DatabaseLogReporter {
  writer: DatabaseLogWriter;
  constructor(storage: IStorage) {
    this.writer = new DatabaseLogWriter(storage);
  }

  write(log: LogMessage) {
    this.writer.push(log);
  }
}

class DatabaseLogWriter {
  private queue: Map<string, LogMessage> = new Map();
  private hasCleared = false;

  constructor(private readonly storage: IStorage) {
    setInterval(() => {
      setTimeout(() => {
        if (!this.hasCleared) {
          this.hasCleared = true;
          this.rotate();
        }
        this.flush();
      });
    }, 10000);
  }

  push(message: LogMessage) {
    const key = new Date(message.timestamp).toLocaleDateString();
    this.queue.set(`${key}:${message.timestamp}`, message);
  }

  async flush() {
    if (this.queue.size === 0) return;
    const queueCopy = Array.from(this.queue.entries());
    this.queue = new Map();

    await this.storage.writeMulti(queueCopy);
  }

  async rotate() {
    const logKeys = (await this.storage.getAllKeys()).sort();
    const keysToRemove = [];
    for (let key of logKeys) {
      const keyParts = key.split(":");
      if (keyParts.length === 1 || parseInt(keyParts[1]) < Date.now() - WEEK) {
        keysToRemove.push(key);
      }
    }

    if (keysToRemove.length) await this.storage.removeMulti(keysToRemove);
  }
}

class DatabaseLogManager {
  constructor(private readonly storage: IStorage) {}

  async get() {
    const logKeys = await this.storage.getAllKeys();
    const logEntries = await this.storage.readMulti<LogMessage>(logKeys);
    const logs: Record<string, LogMessage[]> = {};

    for (const [logKey, log] of logEntries) {
      const keyParts = logKey.split(":");
      if (keyParts.length === 1) continue;

      const key = keyParts[0];
      if (!logs[key]) logs[key] = [];
      logs[key].push(log);
    }

    return Object.keys(logs)
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
      .map((key) => ({
        key,
        logs: logs[key]?.sort((a, b) => a.timestamp - b.timestamp)
      }));
  }

  async clear() {
    const logKeys = await this.storage.getAllKeys();
    await this.storage.removeMulti(logKeys);
  }

  async delete(key: string) {
    const logKeys = await this.storage.getAllKeys();
    const keysToRemove = [];
    for (const logKey of logKeys) {
      const keyParts = logKey.split(":");
      if (keyParts.length === 1) continue;
      const currKey = keyParts[0];
      if (currKey === key) keysToRemove.push(logKey);
    }
    if (keysToRemove.length) await this.storage.removeMulti(keysToRemove);
  }
}

function initialize(storage: IStorage, disableConsoleLogs?: boolean) {
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
let logManager: DatabaseLogManager | undefined = undefined;

export { LogLevel, format, initialize, logManager, logger };
