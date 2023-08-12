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

import { databaseTest } from "../__tests__/utils";
import { login, user } from "./utils";
import { test, expect } from "vitest";

// test("signup user and check for token", async () => {
//   const db = new DB(StorageInterface);
//   const usermanager = new UserManager(db);

//   await expect(
//     usermanager.signup(user.email, user.password)
//   ).resolves.not.toThrow();

//   await expect(usermanager.tokenManager.getToken()).resolves.toBeDefined();
// }, 30000);

test(
  "login user and check for token",
  () =>
    databaseTest().then(async (db) => {
      await expect(login(db)).resolves.not.toThrow();

      await expect(db.user.tokenManager.getToken()).resolves.toBeDefined();
    }),
  30000
);

test(
  "login user and get user data",
  () =>
    databaseTest().then(async (db) => {
      await login(db);

      const userData = await db.user.getUser();
      expect(userData.email).toBe(user.email);
    }),
  30000
);

test(
  "login user and logout user",
  () =>
    databaseTest().then(async (db) => {
      await login(db);

      await expect(db.user.logout()).resolves.not.toThrow();
    }),
  30000
);

// test("login user and delete user", async () => {
//   const db = new DB(StorageInterface);
//   const usermanager = new UserManager(db);

//   await usermanager.login(user.email, user.password, user.hashed);

//   await expect(usermanager.deleteUser(user.password)).resolves.toBe(true);
// }, 30000);

// test("login user and get user sessions", async () => {
//   const db = new DB(StorageInterface);
//   const usermanager = new UserManager(db);

//   await usermanager.login(user.email, user.password);

//   await usermanager.getSessions();
// }, 30000);
