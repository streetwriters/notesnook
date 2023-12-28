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
import "./logger";
import { database } from "@notesnook/common";
import { logger as dbLogger } from "@notesnook/core/dist/logger";
import { Platform } from "react-native";
import * as Gzip from "react-native-gzip";
import EventSource from "../../utils/sse/even-source-ios";
import AndroidEventSource from "../../utils/sse/event-source";
import { SqliteAdapter, SqliteIntrospector, SqliteQueryCompiler } from "kysely";
import filesystem from "../filesystem";
import Storage from "./storage";
import { RNSqliteDriver } from "./sqlite.kysely";
import { getDatabaseKey } from "./encryption";

database.host(
  __DEV__
    ? {
        // API_HOST: "https://api.notesnook.com",
        // AUTH_HOST: "https://auth.streetwriters.co",
        // SSE_HOST: "https://events.streetwriters.co",
        // SUBSCRIPTIONS_HOST: "https://subscriptions.streetwriters.co",
        // ISSUES_HOST: "https://issues.streetwriters.co"
        API_HOST: "http://192.168.43.5:5264",
        AUTH_HOST: "http://192.168.43.5:8264",
        SSE_HOST: "http://192.168.43.5:7264",
        SUBSCRIPTIONS_HOST: "http://192.168.43.5:9264",
        ISSUES_HOST: "http://192.168.43.5:2624"
      }
    : {
        API_HOST: "https://api.notesnook.com",
        AUTH_HOST: "https://auth.streetwriters.co",
        SSE_HOST: "https://events.streetwriters.co",
        SUBSCRIPTIONS_HOST: "https://subscriptions.streetwriters.co",
        ISSUES_HOST: "https://issues.streetwriters.co"
      }
);

export async function setupDatabase(password) {
  const key = await getDatabaseKey(password);
  if (!key)
    throw new Error("Database setup failed, could not get database key");

  console.log("Opening database with key:", key);
  database.setup({
    storage: Storage,
    eventsource: Platform.OS === "ios" ? EventSource : AndroidEventSource,
    fs: filesystem,
    compressor: {
      compress: Gzip.deflate,
      decompress: Gzip.inflate
    },
    batchSize: 100,
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
      password: key
    }
  });
}

export const db = database;
export const DatabaseLogger = dbLogger;
