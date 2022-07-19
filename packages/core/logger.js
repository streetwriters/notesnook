import {
  Logger,
  combineReporters,
  consoleReporter,
  format,
  LogLevel,
} from "@streetwriters/logger";

// Database logger reporter:
// 1. Log to new key on every instance
// 2. Each key contains logs of a session
// 3. Keep 14 days of logs
// 4. Implement functions for log retrieval & filtering

const MAX_RETENTION_LENGTH = 14;

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
   * @param {import("@streetwriters/logger").LogMessage} log
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
  }

  async push(message) {
    const logs = await this.read();

    if (!logs) {
      await this.rotate();
      return this.push(message);
    }

    logs.push(message);
    await this.storage.write(this.key, logs);
  }

  async read() {
    return await this.storage.read(this.key, true);
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

class DatabaseLogger extends Logger {
  /**
   *
   * @param {import("./database/storage").default} storage
   */
  constructor(storage) {
    super({
      reporter: combineReporters([
        new DatabaseLogReporter(storage),
        consoleReporter,
      ]),
      lastTime: Date.now(),
    });
    this.storage = storage;
  }

  async get() {
    const logKeys = await this.storage.getAllKeys();
    const logs = [];
    for (const key of logKeys) {
      const log = await this.storage.read(key, true);
      logs.push({ key, logs: log });
    }
    return logs;
  }
}

/**
 *
 * @param {import("./database/storage").default} storage
 */
function initalize(storage) {
  logger = new DatabaseLogger(storage);
}

/**
 * @type {DatabaseLogger}
 */
var logger;
export { logger, initalize, format, LogLevel };
