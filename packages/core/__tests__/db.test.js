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

import Constants from "../src/utils/constants.ts";
import { test, expect } from "vitest";
import { databaseTest } from "./utils/index.ts";
import DB from "../src/api/index.ts";
import { NodeStorageInterface } from "../__mocks__/node-storage.mock.ts";
import { FS } from "../__mocks__/fs.mock.ts";
import Compressor from "../__mocks__/compressor.mock.js";
import { EventSourcePolyfill as EventSource } from "event-source-polyfill";
import { SqliteDialect } from "@streetwriters/kysely";
import BetterSQLite3 from "better-sqlite3-multiple-ciphers";
import * as betterTrigram from "sqlite-better-trigram";
import * as fts5Html from "sqlite3-fts5-html";
import { getLoadablePath } from "sqlite-regex";

test("db.host should change HOST", () =>
  databaseTest().then((db) => {
    db.host({ API_HOST: "hello world" });
    expect(Constants.API_HOST).toBe("hello world");
  }));

test("kv calls reject if database init fails and work after a retry", async () => {
  const db = new DB();
  let fail = true;
  db.setup({
    storage: new NodeStorageInterface(),
    eventsource: EventSource,
    fs: FS,
    compressor: async () => Compressor,
    sqliteOptions: {
      dialect: () => {
        if (fail) throw new Error("init failed");
        const database = BetterSQLite3(":memory:").unsafeMode(true);
        betterTrigram.load(database);
        fts5Html.load(database);
        database.loadExtension(getLoadablePath());
        return new SqliteDialect({ database });
      }
    }
  });

  const pending = db.kv().read("v");
  await expect(db.init()).rejects.toThrow("init failed");
  await expect(pending).rejects.toThrow("init failed");
  await expect(db.kv().read("v")).rejects.toThrow("init failed");

  fail = false;
  await db.init();
  await expect(db.kv().read("v")).resolves.toBeDefined();
});
