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
} from "kysely";
import { WaSqliteWorkerDriver } from "./wa-sqlite-kysely-driver";
import { isFeatureSupported } from "../../utils/feature-check";

declare module "kysely" {
  interface Driver {
    delete(): Promise<void>;
  }
}

export const createDialect = (name: string): Dialect => {
  return {
    createDriver: () =>
      new WaSqliteWorkerDriver({
        async: isFeatureSupported("opfs") ? false : true,
        dbName: name
      }),
    createAdapter: () => new SqliteAdapter(),
    createIntrospector: (db) => new SqliteIntrospector(db),
    createQueryCompiler: () => new SqliteQueryCompiler()
  };
};
