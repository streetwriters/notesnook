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
    this.queue = new Map();
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
  /**
   *
   * @param {import("./database/storage").default} storage
   */
  constructor(storage) {
    this.storage = storage;
  }

  async get() {
    const logKeys = await this.storage.getAllKeys();
    const logs = await this.storage.readMulti(logKeys);
    const logGroups = {};

    for (const [key, log] of logs) {
      const keyParts = key.split(":");
      if (keyParts.length === 1) continue;

      const groupKey = keyParts[0];
      if (!logGroups[groupKey]) logGroups[groupKey] = [];
      logGroups[groupKey].push(log);
    }

    return Object.keys(logGroups)
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
      .map((key) => ({
        key,
        logs: logGroups[key]?.sort((a, b) => a.timestamp - b.timestamp)
      }));
  }

  async clear() {
    const logKeys = await this.storage.getAllKeys();
    await this.storage.removeMulti(logKeys);
  }

  async delete(key) {
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
