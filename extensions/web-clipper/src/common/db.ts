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
import { database, getFeature, getFeatureLimit } from "@notesnook/common";
import { createDialect } from "@notesnook/web/src/common/sqlite";
import { isFeatureSupported } from "@notesnook/web/src/utils/feature-check";
import {
  deriveKey,
  useKeyStore
} from "@notesnook/web/src/interfaces/key-store";
import {
  DatabasePersistence,
  NNStorage
} from "@notesnook/web/src/interfaces/storage";
import { generatePassword } from "@notesnook/web/src/utils/password-generator";

const db = database;
async function initializeDatabase(persistence: DatabasePersistence) {
  db.host({
    API_HOST: "https://api.notesnook.com",
    AUTH_HOST: "https://auth.streetwriters.co",
    SSE_HOST: "https://events.streetwriters.co",
    ISSUES_HOST: "https://issues.streetwriters.co",
    SUBSCRIPTIONS_HOST: "https://subscriptions.streetwriters.co",
    MONOGRAPH_HOST: "https://monogr.ph",
    NOTESNOOK_HOST: "https://notesnook.com"
  });

  await useKeyStore.getState().init();
  let databaseKey = await useKeyStore.getState().getValue("databaseKey");
  if (!databaseKey) {
    databaseKey = await deriveKey(generatePassword());
    await useKeyStore.getState().setValue("databaseKey", databaseKey);
  }

  const storage = new NNStorage(
    "Notesnook",
    () => useKeyStore.getState(),
    persistence
  );
  await storage.migrate();

  const multiTab = !!globalThis.SharedWorker && isFeatureSupported("opfs");
  database.setup({
    sqliteOptions: {
      dialect: (name, init) =>
        createDialect({
          name: persistence === "memory" ? ":memory:" : name,
          encrypted: true,
          async: !isFeatureSupported("opfs"),
          init,
          multiTab
        }),
      ...(isFeatureSupported("opfs")
        ? { journalMode: "WAL", lockingMode: "exclusive" }
        : {
            journalMode: "MEMORY",
            lockingMode: "normal"
          }),
      tempStore: "memory",
      synchronous: "normal",
      pageSize: 8192,
      cacheSize: -32000,
      password: Buffer.from(databaseKey).toString("hex"),
      skipInitialization: multiTab
    },
    storage: storage,
    eventsource: EventSource,
    // @ts-ignore
    fs: {},
    compressor: () =>
      import("@notesnook/web/src/utils/compressor").then(
        ({ Compressor }) => new Compressor()
      ),
    maxNoteVersions: async () => {
      const limit = await getFeatureLimit(getFeature("maxNoteVersions"));
      return typeof limit.caption === "number" ? limit.caption : undefined;
    },
    batchSize: 100
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

  //   window.addEventListener("beforeunload", async () => {
  //     if (IS_DESKTOP_APP) {
  //       await db.sql().destroy();
  //       await logManager?.close();
  //     }
  //   });

  //   if (db.migrations?.required()) {
  //     await import("../dialogs/migration-dialog").then(({ MigrationDialog }) =>
  //       MigrationDialog.show({})
  //     );
  //   }

  return db;
}

export { db, initializeDatabase };
