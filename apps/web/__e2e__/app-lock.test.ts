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
import { APP_LOCK_PASSWORD, USER } from "./utils";

test("don't show status bar lock app button to unauthenticated user", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();

  expect(await app.lockAppButton()).toBeHidden();
});

test("don't show status bar lock app button to authenticated user", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.auth.goto();

  await app.auth.login(USER.CURRENT);

  expect(await app.lockAppButton()).toBeHidden();
});

test("show status bar lock app button to authenticated user if app lock is enabled", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.auth.goto();
  await app.auth.login(USER.CURRENT);

  const settings = await app.goToSettings();
  await settings.enableAppLock(USER.CURRENT.password!, APP_LOCK_PASSWORD);
  await settings.close();

  expect(await app.lockAppButton()).toBeVisible();
});

test("clicking on status bar lock app button should lock app", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.auth.goto();
  await app.auth.login(USER.CURRENT);

  const settings = await app.goToSettings();
  await settings.enableAppLock(USER.CURRENT.password!, APP_LOCK_PASSWORD);
  await settings.close();
  const lockAppButton = await app.lockAppButton();
  await lockAppButton.waitFor({ state: "visible" });
  await lockAppButton.click();

  expect(page.getByText("Unlock your notes")).toBeVisible();
});

test("disabling app lock setting should remove status bar lock app button", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.auth.goto();
  await app.auth.login(USER.CURRENT);

  let settings = await app.goToSettings();
  await settings.enableAppLock(USER.CURRENT.password!, APP_LOCK_PASSWORD);
  await settings.close();
  (await app.lockAppButton()).waitFor({ state: "visible" });
  settings = await app.goToSettings();
  await settings.disableAppLock(APP_LOCK_PASSWORD);
  await settings.close();

  expect(await app.lockAppButton()).toBeHidden();
});
