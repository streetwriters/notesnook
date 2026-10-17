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

import { expect, test } from "vitest";
import { SqliteDialect, sql } from "@streetwriters/kysely";
import BetterSQLite3 from "better-sqlite3-multiple-ciphers";
import path from "path";
import { tmpdir } from "os";
import { existsSync, mkdirSync } from "fs";
import { createDatabase } from "../src/database/index.js";
import { getId } from "../src/utils/id.js";
import { databaseTest } from "./utils/index.js";

test("database password can contain dots and quotes", async () => {
  const dir = path.join(tmpdir(), "notesnook-tests-tmp");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const dbPath = path.join(dir, `notesnook-${getId()}.sql`);
  const password = `my.secret'"key`;

  const db = await createDatabase("test", {
    dialect: () => new SqliteDialect({ database: BetterSQLite3(dbPath) }),
    password,
    migrationProvider: { getMigrations: async () => ({}) }
  });
  await sql`CREATE TABLE test (value TEXT)`.execute(db);
  await sql`INSERT INTO test VALUES ('hello')`.execute(db);
  await db.destroy();

  const raw = BetterSQLite3(dbPath);
  raw.pragma(`key = '${password.replace(/'/g, "''")}'`);
  expect(raw.prepare("SELECT value FROM test").get()).toEqual({
    value: "hello"
  });
  raw.close();
});

test("reset should work when sqlite is in defensive mode", () =>
  databaseTest("memory", false).then(async (db) => {
    await db.notes.add({ title: "hello" });

    await expect(db.reset()).resolves.toBe(true);

    expect(await db.notes.all.count()).toBe(0);
    await db.notes.add({ title: "world" });
    expect(await db.notes.all.count()).toBe(1);
  }));
