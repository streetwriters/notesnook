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

import { initialize } from "@notesnook/core";
import {
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler
} from "@streetwriters/kysely";
import { Platform } from "react-native";
import { setLogger } from ".";
import { RNSqliteDriver } from "./sqlite.kysely";

let loggerLoaded = false;
const initializeLogger = async () => {
  if (loggerLoaded) return;
  await initialize({
    dialect: (name) => ({
      createDriver: () => {
        return new RNSqliteDriver({ async: true, dbName: name });
      },
      createAdapter: () => new SqliteAdapter(),
      createIntrospector: (db) => new SqliteIntrospector(db),
      createQueryCompiler: () => new SqliteQueryCompiler()
    }),
    tempStore: "memory",
    journalMode: Platform.OS === "ios" ? "DELETE" : "WAL"
  });
  setLogger();
  loggerLoaded = true;
};

export { initializeLogger };
