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

database.host(
  __DEV__
    ? {
        API_HOST: "https://api.notesnook.com",
        AUTH_HOST: "https://auth.streetwriters.co",
        SSE_HOST: "https://events.streetwriters.co",
        SUBSCRIPTIONS_HOST: "https://subscriptions.streetwriters.co",
        ISSUES_HOST: "https://issues.streetwriters.co"
        // API_HOST: "http://192.168.43.108:5264",
        // AUTH_HOST: "http://192.168.43.108:8264",
        // SSE_HOST: "http://192.168.43.108:7264",
        // SUBSCRIPTIONS_HOST: "http://192.168.43.108:9264",
        // ISSUES_HOST: "http://192.168.43.108:2624"
      }
    : {
        API_HOST: "https://api.notesnook.com",
        AUTH_HOST: "https://auth.streetwriters.co",
        SSE_HOST: "https://events.streetwriters.co",
        SUBSCRIPTIONS_HOST: "https://subscriptions.streetwriters.co",
        ISSUES_HOST: "https://issues.streetwriters.co"
      }
);

database.setup({
  storage: Storage,
  eventsource: Platform.OS === "ios" ? EventSource : AndroidEventSource,
  fs: filesystem,
  compressor: {
    compress: Gzip.deflate,
    decompress: Gzip.inflate
  },
  batchSize: 500,
  sqliteOptions: {
    dialect: {
      createDriver: () =>
        new RNSqliteDriver({ async: true, dbName: "test.db" }),
      createAdapter: () => new SqliteAdapter(),
      createIntrospector: (db) => new SqliteIntrospector(db),
      createQueryCompiler: () => new SqliteQueryCompiler()
    }
    // journalMode: "MEMORY",
    // synchronous: "normal",
    // pageSize: 8192,
    // cacheSize: -16000,
    // lockingMode: "exclusive"
  }
});

export const db = database;
export const DatabaseLogger = dbLogger;
