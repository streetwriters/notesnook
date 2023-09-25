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

test("create an unencrypted backup", async ({ page }) => {
  const app = new AppModel(page);
  await app.auth.goto();
  await app.auth.login(USER.CURRENT);
  const settings = await app.goToSettings();
  await settings.toggleBackupEncryption(USER.CURRENT.password);

  const backup = await settings.createBackup(USER.CURRENT.password);

  expect(backup.length > 0).toBeTruthy();
});

test("restore an unencrypted backup", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const settings = await app.goToSettings();

  await settings.restoreData("backup.nnbackup");

  await settings.close();
  const notes = await app.goToNotes();
  expect(await notes.isEmpty()).toBeFalsy();
  const notebooks = await app.goToNotebooks();
  expect(await notebooks.isEmpty()).toBeFalsy();
  const tags = await app.goToTags();
  expect(await tags.isEmpty()).toBeFalsy();
});

test("create an encrypted backup", async ({ page }, info) => {
  info.setTimeout(60 * 1000);

  const app = new AppModel(page);
  await app.auth.goto();
  await app.auth.login(USER.CURRENT);
  const settings = await app.goToSettings();

  const backup = await settings.createBackup();

  expect(backup.length > 0).toBeTruthy();
});

test("restore an encrypted backup", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const settings = await app.goToSettings();

  await settings.restoreData("encrypted.nnbackup", USER.CURRENT.password);

  await settings.close();
  const notes = await app.goToNotes();
  expect(await notes.isEmpty()).toBeFalsy();
  const notebooks = await app.goToNotebooks();
  expect(await notebooks.isEmpty()).toBeFalsy();
});

test("turning off encrypted backups should ask for password", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.auth.goto();
  await app.auth.login(USER.CURRENT);
  const settings = await app.goToSettings();

  await settings.toggleBackupEncryption(USER.CURRENT.password);

  expect(await settings.isBackupEncryptionEnabled(false)).toBe(false);
});

test("turning on encrypted backups should not ask for password", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.auth.goto();
  await app.auth.login(USER.CURRENT);
  const settings = await app.goToSettings();
  await settings.toggleBackupEncryption(USER.CURRENT.password);

  await settings.toggleBackupEncryption();

  expect(await settings.isBackupEncryptionEnabled(true)).toBe(true);
});
