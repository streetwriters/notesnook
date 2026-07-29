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
  Kysely,
  Migration,
  MigrationProvider,
  SqliteDialect,
  sql
} from "@streetwriters/kysely";
import BetterSQLite3 from "better-sqlite3-multiple-ciphers";
import * as betterTrigram from "sqlite-better-trigram";
import * as fts5Html from "sqlite3-fts5-html";
import { getLoadablePath } from "sqlite-regex";
import { NNMigrationProvider } from "../src/database/migrations.js";
import {
  initializeDatabase,
  SqliteBooleanPlugin
} from "../src/database/index.js";
import { describe, expect, test } from "vitest";

function createSchemaTestDatabase() {
  const sqlite = BetterSQLite3(":memory:").unsafeMode(true);
  betterTrigram.load(sqlite);
  fts5Html.load(sqlite);
  sqlite.loadExtension(getLoadablePath());

  return new Kysely({
    dialect: new SqliteDialect({
      database: sqlite
    }),
    plugins: [new SqliteBooleanPlugin()]
  });
}

async function createMigrationProviderBefore(migrationName: string) {
  const migrations = await new NNMigrationProvider().getMigrations();
  const entries = Object.entries(migrations);
  const index = entries.findIndex(([name]) => name === migrationName);

  if (index === -1) {
    throw new Error(`Migration not found: ${migrationName}`);
  }

  return {
    migrations,
    provider: {
      async getMigrations() {
        return Object.fromEntries(entries.slice(0, index));
      }
    } satisfies MigrationProvider
  };
}

describe("Schema migration recovery", () => {
  test("replays a partially applied spellcheck migration", async () => {
    const db = createSchemaTestDatabase();

    try {
      const { migrations, provider } = await createMigrationProviderBefore(
        "a-2026-04-06"
      );

      await initializeDatabase(db, provider, "notesnook-test");
      await migrations["a-2026-04-06"]?.up(db);

      await initializeDatabase(db, new NNMigrationProvider(), "notesnook-test");

      const migrationRow = await sql<{ name: string }>`
        SELECT name
        FROM kysely_migration
        WHERE name = ${"a-2026-04-06"}
      `.execute(db);
      const column = await sql<{ name: string }>`
        SELECT name
        FROM pragma_table_info(${"notes"})
        WHERE name = ${"spellcheck"}
      `.execute(db);

      expect(migrationRow.rows).toHaveLength(1);
      expect(column.rows).toHaveLength(1);
    } finally {
      await db.destroy();
    }
  });

  test("replays a partially applied inbox items history migration", async () => {
    const db = createSchemaTestDatabase();

    try {
      const { migrations, provider } = await createMigrationProviderBefore(
        "a-2026-05-07"
      );

      await initializeDatabase(db, provider, "notesnook-test");
      await migrations["a-2026-05-07"]?.up(db);

      await initializeDatabase(db, new NNMigrationProvider(), "notesnook-test");

      const migrationRow = await sql<{ name: string }>`
        SELECT name
        FROM kysely_migration
        WHERE name = ${"a-2026-05-07"}
      `.execute(db);
      const table = await sql<{ name: string }>`
        SELECT name
        FROM sqlite_master
        WHERE type = 'table' AND name = ${"inboxitemshistory"}
      `.execute(db);

      expect(migrationRow.rows).toHaveLength(1);
      expect(table.rows).toHaveLength(1);
    } finally {
      await db.destroy();
    }
  });
});
