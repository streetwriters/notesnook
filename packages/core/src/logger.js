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
  LogLevel,
  Logger,
  NoopLogger,
  combineReporters,
  consoleReporter,
  format
} from "@notesnook/logger";

const WEEK = 86400000 * 7;

// Database logger reporter:
// 1. Log to new key on every instance
// 2. Each key contains logs of a session
// 3. Keep 7 days of logs
// 4. Implement functions for log retrieval & filtering

class DatabaseLogReporter {
  /**
   *
   * @param {import("./database/storage").default} storage
   */
  constructor(storage) {
    this.writer = new DatabaseLogWriter(storage);
  }

  /**
   *
   * @param {import("@notesnook/logger").LogMessage} log
   */
  write(log) {
    this.writer.push(log);
  }
}

class DatabaseLogWriter {
  /**
   *
   * @param {import("./database/storage").default} storage
   */
  constructor(storage) {
    this.storage = storage;
    this.key = new Date().toLocaleDateString();
    this.queue = {};
    this.hasCleared = false;
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

  push(message) {
    this.queue[`${this.key}:${message.timestamp}`] = message;
  }

  async read() {
    const logKeys = await this.storage.getAllKeys();
    const keys = [];
    for (let key of logKeys) {
      if (key.startsWith(this.key)) keys.push(key);
    }
    return Object.values(await this.storage.readMulti(keys));
  }

  async flush() {
    if (Object.keys(this.queue).length === 0) return;
    const queueCopy = Object.entries(this.queue);
    this.queue = {};

    await this.storage.writeMulti(queueCopy);
  }

  async rotate() {
    const logKeys = (await this.storage.getAllKeys()).sort();
    for (let key of logKeys) {
      const keyParts = key.split(":");
      if (keyParts.length === 1 || parseInt(keyParts[1]) < Date.now() - WEEK) {
        await this.storage.remove(key);
      }
    }
  }
}

class DatabaseLogManager {
  /**
   *
   * @param {import("./database/storage").default} storage
   */
  constructor(storage) {
    this.storage = storage;
  }

  async get() {
    const logKeys = await this.storage.getAllKeys();
    const logs = {};

    for (const logKey of logKeys) {
      const keyParts = logKey.split(":");
      if (keyParts.length === 1) continue;
      const key = keyParts[0];

      const log = await this.storage.read(logKey, true);

      if (!logs[key]) logs[key] = [];
      logs[key].push(log);
    }

    return Object.keys(logs).map((key) => ({
      key: key,
      logs: logs[key]?.sort((a, b) => a.timestamp - b.timestamp)
    }));
  }

  async clear() {
    const logKeys = await this.storage.getAllKeys();
    for (const key of logKeys) {
      await this.storage.remove(key);
    }
  }

  async delete(key) {
    const logKeys = await this.storage.getAllKeys();
    for (const logKey of logKeys) {
      const keyParts = logKey.split(":");
      if (keyParts.length === 1) continue;
      const currKey = keyParts[0];
      if (currKey === key) {
        await this.storage.remove(logKey);
      }
    }
  }
}

function initalize(storage, disableConsoleLogs) {
  if (storage) {
    let reporters = [new DatabaseLogReporter(storage)];
    if (process.env.NODE_ENV !== "production" && !disableConsoleLogs)
      reporters.push(consoleReporter);
    logger = new Logger({
      reporter: combineReporters(reporters),
      lastTime: Date.now()
    });
    logManager = new DatabaseLogManager(storage);
  }
}

/**
 * @type {import("@notesnook/logger").ILogger}
 */
var logger = new NoopLogger();

/**
 * @type {DatabaseLogManager | undefined}
 */
var logManager;

export { LogLevel, format, initalize, logManager, logger };
