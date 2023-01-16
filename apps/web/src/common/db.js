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
import { NNStorage } from "../interfaces/storage";
import { logger } from "../utils/logger";

/**
 * @type {import("@notesnook/core/api/index").default}
 */
var db;
async function initializeDatabase(persistence) {
  logger.measure("Database initialization");

  const { default: Database } = await import("@notesnook/core/api");
  const { default: FS } = await import("../interfaces/fs");
  const { Compressor } = await import("../utils/compressor");
  db = new Database(
    new NNStorage("Notesnook", persistence),
    EventSource,
    FS,
    new Compressor()
  );

  // if (isTesting()) {
  db.host({
    API_HOST: "https://api.notesnook.com",
    AUTH_HOST: "https://auth.streetwriters.co",
    SSE_HOST: "https://events.streetwriters.co"
  });
  // } else {
  // db.host({
  //   API_HOST: "http://localhost:5264",
  //   AUTH_HOST: "http://localhost:8264",
  //   SSE_HOST: "http://localhost:7264",
  // });
  // const base = `http://${process.env.REACT_APP_LOCALHOST}`;
  // db.host({
  //   API_HOST: `${base}:5264`,
  //   AUTH_HOST: `${base}:8264`,
  //   SSE_HOST: `${base}:7264`,
  //   ISSUES_HOST: `${base}:2624`,
  //   SUBSCRIPTIONS_HOST: `${base}:9264`,
  // });
  // }

  // db.eventManager.subscribe(EVENTS.databaseMigrating, async ({ from, to }) => {

  // });

  await db.init();

  logger.measure("Database initialization");

  if (db.migrations.required()) {
    const { showMigrationDialog } = await import("./dialog-controller");
    await showMigrationDialog();
  }
  return db;
}

export { db, initializeDatabase };
