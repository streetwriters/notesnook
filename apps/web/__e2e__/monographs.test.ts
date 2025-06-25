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

import { test, expect } from "@playwright/test";
import { AppModel } from "./models/app.model";
import { USER } from "./utils";

test("don't show monographs list to unauthenticated user", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();

  await expect(
    async () => await app.navigateTo("Monographs")
  ).rejects.toThrowError();
});

test("show monographs list to authenticated user", async ({ page }) => {
  const app = new AppModel(page);
  await app.auth.goto();

  await app.auth.login(USER.CURRENT);

  await app.navigateTo("Monographs");
});
