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

import { databaseTest, noteTest } from "../__tests__/utils/index.ts";
import { login, logout } from "./utils.js";
import { test, expect, afterAll } from "vitest";

const TEST_TIMEOUT = 30 * 1000;

afterAll(async () => {
  const db = await databaseTest();
  await login(db);
  await db.monographs.refresh();

  for (const id of db.monographs.monographs) {
    await db.monographs.unpublish(id);
  }

  await logout(db);
}, TEST_TIMEOUT);

// test("get monographs", () =>
//   databaseTest().then(async (db) => {
//     await db.user.login(user.email, user.password, user.hashedPassword);

//     await db.monographs.refresh();

//     expect(db.monographs.all).toBeGreaterThanOrEqual(0);
//   }));

test(
  "publish a monograph",
  () =>
    noteTest().then(async ({ db, id }) => {
      await login(db);
      await db.monographs.refresh();

      const title = "mono";
      const monographId = await db.monographs.publish(id, title);

      expect(await db.monographs.all.has(id)).toBeTruthy();

      const monograph = await db.monographs.get(monographId);
      expect(monograph.id).toBe(monographId);
      expect(monograph.title).toBe(title);

      await logout(db);
    }),
  TEST_TIMEOUT
);

test(
  "update a published monograph",
  () =>
    noteTest().then(async ({ db, id }) => {
      await login(db);
      await db.monographs.refresh();

      const title = "mono";
      const monographId = await db.monographs.publish(id, title);
      let monograph = await db.monographs.get(monographId);
      expect(monograph.title).toBe(title);

      const editedTitle = "monograph";
      await db.monographs.publish(id, editedTitle);
      monograph = await db.monographs.get(monographId);
      expect(monograph.title).toBe(editedTitle);

      await logout(db);
    }),
  TEST_TIMEOUT
);

test(
  "unpublish a monograph",
  () =>
    noteTest().then(async ({ db, id }) => {
      await login(db);
      await db.monographs.refresh();

      await db.monographs.publish(id, "mono");
      expect(await db.monographs.all.has(id)).toBeTruthy();

      await db.monographs.unpublish(id);
      expect(await db.monographs.all.has(id)).toBeFalsy();

      await logout(db);
    }),
  TEST_TIMEOUT
);
