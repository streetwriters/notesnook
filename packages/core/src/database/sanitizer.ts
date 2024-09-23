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

import { DatabaseAccessor } from "./index.js";
import { logger } from "../logger.js";

export class Sanitizer {
  tables: Record<string, Set<string>> = {};
  logger = logger.scope("sanitizer");
  constructor(private readonly db: DatabaseAccessor) {}

  async init() {
    const metadata = await this.db().introspection.getTables({
      withInternalKyselyTables: false
    });
    for (const table of metadata) {
      this.tables[table.name] = new Set(table.columns.map((c) => c.name));
    }
  }

  /**
   * Sanitization is done based on the latest table schema in the database. All
   * unrecognized keys are removed
   */
  sanitize(table: string, item: any) {
    const schema = this.tables[table];
    if (!schema) {
      if (process.env.NODE_ENV === "test")
        throw new Error(
          `Invalid table: ${table} (expected one of ${Object.keys(
            this.tables
          ).join(", ")})`
        );
      return false;
    }

    for (const key in item) {
      if (schema.has(key)) continue;
      if (process.env.NODE_ENV === "test")
        throw new Error(`Found invalid key in item ${key} (${table})`);
      else
        this.logger.debug("Found invalid key in item", {
          table,
          key,
          value: item[key]
        });
      delete item[key];
    }
    return true;
  }
}
