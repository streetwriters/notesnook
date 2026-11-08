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

import {
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler
} from "@streetwriters/kysely";
import type { DatabaseHost } from "../../../../platform";
import { compression } from "../compression";
import { open } from "react-native-quick-sqlite";
import { clearDatabaseKey, getDatabaseKey } from "./encryption";
import { RNSqliteDriver } from "./sqlite.kysely";
import { Storage } from "./storage";

class UnsupportedEventSource {
  constructor() {
    throw new Error("EventSource is not implemented on desktop yet");
  }
}

export const databaseHost: DatabaseHost = {
  createDialect: ({ name }) => ({
    createDriver: () =>
      new RNSqliteDriver({
        async: true,
        dbName: name
      }),
    createAdapter: () => new SqliteAdapter(),
    createIntrospector: (db) => new SqliteIntrospector(db),
    createQueryCompiler: () => new SqliteQueryCompiler()
  }),
  journalMode: "WAL",
  lockingMode: "normal",
  createStorage: async () => Storage,
  getDatabaseKey: async () => (await getDatabaseKey()) as string,
  disableAppLock: async () => {
    throw new Error("App lock is not implemented on desktop yet");
  },
  async delete() {
    open({ name: "notesnook" }).delete();
    clearDatabaseKey();
  },
  eventSource: UnsupportedEventSource,
  compression
};
