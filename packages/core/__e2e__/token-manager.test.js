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

import DB from "../api";
import StorageInterface from "../__mocks__/storage.mock";
import { login } from "./utils";

test("refresh token concurrently", async () => {
  const db = new DB(StorageInterface);
  await db.init();

  await expect(login(db)).resolves.not.toThrow();

  const token = await db.user.tokenManager.getToken();
  expect(token).toBeDefined();

  expect(
    await Promise.all([
      db.user.tokenManager._refreshToken(true),
      db.user.tokenManager._refreshToken(true),
      db.user.tokenManager._refreshToken(true),
      db.user.tokenManager._refreshToken(true)
    ])
  ).toHaveLength(4);
}, 30000);

test("refresh token using the same refresh_token multiple time", async () => {
  const db = new DB(StorageInterface);
  await db.init();

  await expect(login(db)).resolves.not.toThrow();

  const token = await db.user.tokenManager.getToken();
  expect(token).toBeDefined();
  for (let i = 0; i <= 5; ++i) {
    await db.user.tokenManager._refreshToken(true);
    await db.user.tokenManager.saveToken(token);
  }
}, 30000);
