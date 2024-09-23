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
  SqliteQueryCompiler,
  SqliteIntrospector,
  Dialect
} from "@streetwriters/kysely";
import {
  WaSqliteWorkerMultipleTabDriver,
  WaSqliteWorkerSingleTabDriver
} from "./wa-sqlite-kysely-driver";

declare module "@streetwriters/kysely" {
  interface Driver {
    delete(): Promise<void>;
  }
}

export type DialectOptions = {
  name: string;
  encrypted: boolean;
  async: boolean;
  multiTab: boolean;
  init?: () => Promise<void>;
};
export const createDialect = (options: DialectOptions): Dialect => {
  const { async, encrypted, multiTab, name, init } = options;
  return {
    createDriver: () =>
      multiTab
        ? new WaSqliteWorkerMultipleTabDriver({
            async,
            dbName: name,
            encrypted,
            init
          })
        : new WaSqliteWorkerSingleTabDriver({
            async,
            dbName: name,
            encrypted
          }),
    createAdapter: () => new SqliteAdapter(),
    createIntrospector: (db) => new SqliteIntrospector(db),
    createQueryCompiler: () => new SqliteQueryCompiler()
  };
};
