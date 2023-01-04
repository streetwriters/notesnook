/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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
import { test, Browser, expect } from "@playwright/test";
import { AppModel } from "./models/app.model";
import { NOTE, USER } from "./utils";

test("Create a backup", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  await notes.createNote(NOTE);
  const settings = await app.goToSettings();
  const backup = await settings.createBackup();
  expect(backup.length > 0).toBeTruthy();
});

test.setTimeout(45 * 1000);
test("Restore a backup", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();

  const settings = await app.goToSettings();
  const backup = await settings.restoreData("backup.nnbackup");
  const notes = await app.goToNotes();
  expect(await notes.isListFilled()).toBeTruthy();
  const notebooks = await app.goToNotebooks();
  expect(await notebooks.isListFilled()).toBeTruthy();
  const favotites = await app.goToFavorites();
  expect(await favotites.isListFilled()).toBeTruthy();
  const tags = await app.goToTags();
  expect(await tags.isListFilled()).toBeTruthy();
});

test("Create an encrypted backup", async ({ page }) => {
  const app = new AppModel(page);
  await app.auth.goto();
  await app.auth.login(USER.CURRENT);
  const settings = await app.goToSettings();
  const backup = await settings.createBackup(USER.CURRENT.password);

  expect(backup.length > 0).toBeTruthy();
});

test("Restore an encrypted backup", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();

  const settings = await app.goToSettings();
  const backup = await settings.restoreData(
    "encrypted.nnbackup",
    USER.CURRENT.password
  );
  const notes = await app.goToNotes();
  expect(await notes.isListFilled()).toBeTruthy();
  const notebooks = await app.goToNotebooks();
  expect(await notebooks.isListFilled()).toBeTruthy();
  const favotites = await app.goToFavorites();
  expect(await favotites.isListFilled()).toBeTruthy();
  const tags = await app.goToTags();
  expect(await tags.isListFilled()).toBeTruthy();
});
