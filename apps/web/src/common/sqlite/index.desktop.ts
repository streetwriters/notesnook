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
  SqliteDriver as KSqliteDriver,
  SqliteDialectConfig,
  Dialect,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler
} from "kysely";
import { desktop } from "../desktop-bridge";

class SqliteDriver extends KSqliteDriver {
  constructor(private readonly config: SqliteDialectConfig & { name: string }) {
    super(config);
  }
  async delete() {
    const path = await desktop!.integration.resolvePath.query({
      filePath: `userData/${this.config.name}.sql`
    });
    await desktop?.integration.deleteFile.query(path);
  }
}

export const createDialect = (name: string): Dialect => {
  return {
    createDriver: () =>
      new SqliteDriver({
        name,
        database: async () => {
          const path = await desktop!.integration.resolvePath.query({
            filePath: `userData/${name}.sql`
          });
          return window.createSQLite3Database(path).unsafeMode(true);
        }
      }),
    createAdapter: () => new SqliteAdapter(),
    createIntrospector: (db) => new SqliteIntrospector(db),
    createQueryCompiler: () => new SqliteQueryCompiler()
  };
};
