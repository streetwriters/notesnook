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
import { logger as dbLogger, ICompressor } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import {
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler
} from "@streetwriters/kysely";
import { Platform } from "react-native";
import * as Gzip from "react-native-gzip";
import EventSource from "../../utils/sse/even-source-ios";
import AndroidEventSource from "../../utils/sse/event-source";
import { FileStorage } from "../filesystem";
import { getDatabaseKey } from "./encryption";
import "./logger";
import { RNSqliteDriver } from "./sqlite.kysely";
import { Storage } from "./storage";
import SettingsService from "../../services/settings";

export async function setupDatabase(password?: string) {
  const key = await getDatabaseKey(password);
  if (!key) throw new Error(strings.databaseSetupFailed());

  // const base = `http://192.168.100.92`;

  // database.host({
  //   API_HOST: `${base}:5264`,
  //   AUTH_HOST: `${base}:8264`,
  //   SSE_HOST: `${base}:7264`,
  //   ISSUES_HOST: `${base}:2624`,
  //   SUBSCRIPTIONS_HOST: `${base}:9264`,
  //   MONOGRAPH_HOST: `${base}:6264`,
  //   NOTESNOOK_HOST: `${base}:8788`
  // });

  database.host({
    API_HOST: "https://api.notesnook.com",
    AUTH_HOST: "https://auth.streetwriters.co",
    SSE_HOST: "https://events.streetwriters.co",
    SUBSCRIPTIONS_HOST: "https://subscriptions.streetwriters.co",
    ISSUES_HOST: "https://issues.streetwriters.co",
    MONOGRAPH_HOST: "https://monogr.ph",
    NOTESNOOK_HOST: "https://notesnook.com",
    ...(SettingsService.getProperty("serverUrls") || {})
  });

  database.setup({
    storage: Storage,
    eventsource: (Platform.OS === "ios"
      ? EventSource
      : AndroidEventSource) as any,
    fs: FileStorage,
    compressor: async () =>
      ({
        compress: Gzip.deflate,
        decompress: Gzip.inflate
      }) as ICompressor,
    batchSize: 50,
    sqliteOptions: {
      dialect: (name) => ({
        createDriver: () => {
          return new RNSqliteDriver({ async: true, dbName: name });
        },
        createAdapter: () => new SqliteAdapter(),
        createIntrospector: (db) => new SqliteIntrospector(db),
        createQueryCompiler: () => new SqliteQueryCompiler()
      }),
      tempStore: "memory",
      journalMode: Platform.OS === "ios" ? "DELETE" : "WAL",
      password: key
    },
    maxNoteVersions: async () => {
      const limit = await getFeatureLimit(getFeature("maxNoteVersions"));
      return typeof limit.caption === "number" ? limit.caption : undefined;
    }
  });
}

export const db = database;
let DatabaseLogger = dbLogger.scope(Platform.OS);

const setLogger = () => {
  DatabaseLogger = dbLogger.scope(Platform.OS);
};

export { DatabaseLogger, setLogger };
