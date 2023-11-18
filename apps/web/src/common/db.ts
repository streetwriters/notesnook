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
import type Database from "@notesnook/core/dist/api";
import { showMigrationDialog } from "./dialog-controller";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
let db: Database = {};
async function initializeDatabase(persistence: DatabasePersistence) {
  logger.measure("Database initialization");

  const { database } = await import("@notesnook/common");
  const { default: FS } = await import("../interfaces/fs");
  const { Compressor } = await import("../utils/compressor");
  db = database;

  db.host({
    API_HOST: "https://api.notesnook.com",
    AUTH_HOST: "https://auth.streetwriters.co",
    SSE_HOST: "https://events.streetwriters.co",
    ISSUES_HOST: "https://issues.streetwriters.co",
    SUBSCRIPTIONS_HOST: "https://subscriptions.streetwriters.co"
  });

  database.setup(
    await NNStorage.createInstance("Notesnook", persistence),
    EventSource,
    FS,
    new Compressor()
  );
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
