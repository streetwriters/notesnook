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

import { EventSourcePolyfill as EventSource } from "event-source-polyfill";
import { DatabasePersistence, NNStorage } from "../interfaces/storage";
import { logger } from "../utils/logger";
import { showMigrationDialog } from "./dialog-controller";
import { database } from "@notesnook/common";
import { createDialect } from "./sqlite";
import { isFeatureSupported } from "../utils/feature-check";
import { generatePassword } from "../utils/password-generator";
import { deriveKey } from "../interfaces/key-store";

const db = database;
async function initializeDatabase(persistence: DatabasePersistence) {
  logger.measure("Database initialization");

  const { FileStorage } = await import("../interfaces/fs");
  const { Compressor } = await import("../utils/compressor");
  const { useKeyStore } = await import("../interfaces/key-store");

  let databaseKey = await useKeyStore.getState().getValue("databaseKey");
  if (!databaseKey) {
    databaseKey = await deriveKey(generatePassword());
    await useKeyStore.getState().setValue("databaseKey", databaseKey);
  }

  db.host({
    API_HOST: "https://api.notesnook.com",
    AUTH_HOST: "https://auth.streetwriters.co",
    SSE_HOST: "https://events.streetwriters.co",
    ISSUES_HOST: "https://issues.streetwriters.co",
    SUBSCRIPTIONS_HOST: "https://subscriptions.streetwriters.co"
  });

  const storage = new NNStorage(
    "Notesnook",
    () => useKeyStore.getState(),
    persistence
  );
  await storage.migrate();

  database.setup({
    sqliteOptions: {
      dialect: createDialect,
      ...(IS_DESKTOP_APP || isFeatureSupported("opfs")
        ? { journalMode: "WAL", lockingMode: "exclusive" }
        : {
            journalMode: "MEMORY",
            lockingMode: "exclusive"
          }),
      tempStore: "memory",
      synchronous: "normal",
      pageSize: 8192,
      cacheSize: -32000,
      password: Buffer.from(databaseKey).toString("hex")
    },
    storage: storage,
    eventsource: EventSource,
    fs: FileStorage,
    compressor: new Compressor(),
    batchSize: 500
  });

  // if (IS_TESTING) {

  // } else {
  // db.host({
  //   API_HOST: "http://localhost:5264",
  //   AUTH_HOST: "http://localhost:8264",
  //   SSE_HOST: "http://localhost:7264",
  // });
  // const base = `http://localhost`;
  // db.host({
  //   API_HOST: `${base}:5264`,
  //   AUTH_HOST: `${base}:8264`,
  //   SSE_HOST: `${base}:7264`,
  //   ISSUES_HOST: `${base}:2624`,
  //   SUBSCRIPTIONS_HOST: `${base}:9264`
  // });
  // }

  await db.init();

  logger.measure("Database initialization");

  if (db.migrations?.required()) {
    await showMigrationDialog();
  }

  return db;
}

export { db, initializeDatabase };
