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

import { describe, it, expect } from "vitest";
import { initialize, logManager, logger } from "../src/logger.js";
import { SqliteDialect } from "@streetwriters/kysely";
import BetterSQLite3 from "better-sqlite3-multiple-ciphers";
import { NoopLogger } from "@notesnook/logger";
import { delay } from "./utils/index.js";

async function initializeLogger() {
  await initialize(
    {
      dialect: (name) =>
        new SqliteDialect({
          database: BetterSQLite3(":memory:").unsafeMode(true)
        }),
      journalMode: "WAL",
      lockingMode: "exclusive",
      tempStore: "memory",
      synchronous: "normal",
      pageSize: 8192,
      cacheSize: -32000
    },
    true
  );
}

describe("Logger", () => {
  it("should initialize the logger", async () => {
    await initializeLogger();
    expect(logger).not.toBeInstanceOf(NoopLogger);
    expect(logManager).toBeDefined();
  });

  it("should log messages to the database", async () => {
    await initializeLogger();
    logger.log("Test message");
    await delay(500);
    const logs = await logManager?.get();
    expect(logs).toBeDefined();
    expect(logs?.length).toBe(1);
    expect(logs?.[0].logs[0].message).toBe("Test message");
  });

  it("should clear all logs from the database", async () => {
    await initializeLogger();
    logger.log("Test message 1");
    logger.log("Test message 2");
    logger.log("Test message 3");
    await delay(500);
    await logManager?.clear();
    const logs = await logManager?.get();
    expect(logs).toBeDefined();
    expect(logs?.length).toBe(0);
  });

  it("should delete logs with a specific key from the database", async () => {
    await initializeLogger();
    logger.log("Test message 1");
    logger.log("Test message 2");
    logger.log("Test message 3");
    await delay(500);
    const keyToDelete = (await logManager?.get())?.[0]?.key;
    await logManager?.delete(keyToDelete!);
    const logsAfterDeletion = await logManager?.get();
    expect(logsAfterDeletion).toBeDefined();
    expect(logsAfterDeletion?.length).toBe(0);
  });
});
