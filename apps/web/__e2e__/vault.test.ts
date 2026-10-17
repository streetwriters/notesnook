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

import { AppModel } from "./models/app.model";
import { getTestId, NOTE, PASSWORD } from "./utils";
import { test, expect } from "@nn/test";

test("locking a note should not unlock the vault", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note = await notes.createNote(NOTE);
  const vaultUnlockedStatus = page.locator(getTestId("vault-unlocked"));
  const passwordField = page
    .locator(".active")
    .locator(getTestId("unlock-note-password"));

  await note?.contextMenu.lock(PASSWORD);

  await expect(passwordField).toBeVisible();
  await expect(vaultUnlockedStatus).toBeHidden();
});

test("clicking on vault unlocked status should lock the vault", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note = await notes.createNote(NOTE);
  const vaultUnlockedStatus = page.locator(getTestId("vault-unlocked"));

  await note?.contextMenu.lock(PASSWORD);
  await note?.openLockedNote(PASSWORD);
  await vaultUnlockedStatus.waitFor({ state: "visible" });
  await vaultUnlockedStatus.click();

  await expect(vaultUnlockedStatus).toBeHidden();
  expect(await note?.contextMenu.isLocked()).toBe(true);
});

test("opening a locked note should show vault unlocked status", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note = await notes.createNote(NOTE);
  const vaultUnlockedStatus = page.locator(getTestId("vault-unlocked"));

  await note?.contextMenu.lock(PASSWORD);
  await note?.openLockedNote(PASSWORD);

  await expect(vaultUnlockedStatus).toBeVisible();
});

test("unlocking a note permanently should not show vault unlocked status", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note = await notes.createNote(NOTE);
  const vaultUnlockedStatus = page.locator(getTestId("vault-unlocked"));

  await note?.contextMenu.lock(PASSWORD);
  await note?.contextMenu.unlock(PASSWORD);

  await expect(vaultUnlockedStatus).toBeHidden();
});

test("clicking on vault unlocked status should lock the note", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note = await notes.createNote(NOTE);
  await note?.contextMenu.lock(PASSWORD);
  await note?.openLockedNote(PASSWORD);

  expect(await note?.isLockedNotePasswordFieldVisible()).toBe(false);

  const vaultUnlockedStatus = page.locator(getTestId("vault-unlocked"));
  await vaultUnlockedStatus.waitFor({ state: "visible" });
  await vaultUnlockedStatus.click();

  expect(await note?.isLockedNotePasswordFieldVisible()).toBe(true);
});

test("opening a locked note while vault is unlocked should not ask for password", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const noteA = await notes.createNote({ title: "Note A", content: "A" });
  const noteB = await notes.createNote({ title: "Note B", content: "B" });
  const vaultUnlockedStatus = page.locator(getTestId("vault-unlocked"));

  await noteA?.contextMenu.lock(PASSWORD);
  await noteB?.contextMenu.lock(PASSWORD);

  await noteA?.click();
  await noteA?.openLockedNote(PASSWORD);
  await vaultUnlockedStatus.waitFor({ state: "visible" });
  await noteB?.click();
  await notes.editor.waitForLoading("Note B");

  expect(await noteB?.isLockedNotePasswordFieldVisible()).toBe(false);
  expect(await notes.editor.getContent("text")).toBe("B");
});

test("clicking on vault unlocked status should lock the readonly note", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note = await notes.createNote(NOTE);
  await note?.properties.readonly();
  await note?.contextMenu.lock(PASSWORD);
  await note?.openLockedNote(PASSWORD);

  expect(await note?.isLockedNotePasswordFieldVisible()).toBe(false);

  const vaultUnlockedStatus = page.locator(getTestId("vault-unlocked"));
  await vaultUnlockedStatus.waitFor({ state: "visible" });
  await vaultUnlockedStatus.click();

  expect(await note?.isLockedNotePasswordFieldVisible()).toBe(true);
});
