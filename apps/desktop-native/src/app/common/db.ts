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
import { database, getFeature, getFeatureLimit } from "@notesnook/common";
import { hosts } from "@notesnook/core";
import {
  attachmentFiles,
  databaseHost,
  type DatabasePersistence
} from "@platform";
import Config from "../utils/config";

const db = database;
async function initializeDatabase(persistence: DatabasePersistence) {
  performance.mark("start:initializeDatabase");

  const databaseKey = await databaseHost.getDatabaseKey();

  db.host({
    API_HOST: "https://api.notesnook.com",
    AUTH_HOST: "https://auth.streetwriters.co",
    SSE_HOST: "https://events.streetwriters.co",
    ISSUES_HOST: "https://issues.streetwriters.co",
    SUBSCRIPTIONS_HOST: "https://subscriptions.streetwriters.co",
    MONOGRAPH_HOST: "https://monogr.ph",
    NOTESNOOK_HOST: "https://notesnook.com",
    ...Config.get<Partial<typeof hosts>>("serverUrls", {})
  });

  const storage = await databaseHost.createStorage(persistence);
  database.setup({
    sqliteOptions: {
      dialect: (name) =>
        databaseHost.createDialect({
          name: persistence === "memory" ? ":memory:" : name,
          encrypted: persistence !== "memory"
        }),
      journalMode: databaseHost.journalMode,
      lockingMode: databaseHost.lockingMode,
      tempStore: "memory",
      synchronous: "normal",
      pageSize: 8192,
      cacheSize: -32000,
      password:
        persistence === "memory"
          ? undefined
          : Buffer.from(databaseKey).toString("hex"),
      skipInitialization: false
    },
    storage,
    eventsource: databaseHost.eventSource as any,
    fs: attachmentFiles.storage,
    compressor: () => Promise.resolve(databaseHost.compression),
    maxNoteVersions: async () => {
      const limit = await getFeatureLimit(getFeature("maxNoteVersions"));
      return typeof limit.caption === "number" ? limit.caption : undefined;
    },
    batchSize: 100
  });

  performance.mark("start:initdb");
  await db.init();
  performance.mark("end:initdb");

  if (db.migrations?.required()) {
    await import("../dialogs/migration-dialog").then(({ MigrationDialog }) =>
      MigrationDialog.show({})
    );
  }

  performance.mark("end:initializeDatabase");

  return db;
}

export { db, initializeDatabase };
