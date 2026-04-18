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
import { expect, NOTE, test } from "./utils";

test("clear trash", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note = await notes.createNote(NOTE);
  await note?.contextMenu.moveToTrash();
  const trash = await app.goToTrash();
  let trashedNote = await trash.findItem(NOTE.title);
  expect(trashedNote).toBeDefined();

  const trashItem = await app.navigation.findItem("Trash");
  await trashItem?.clearTrash();

  trashedNote = await trash.findItem(NOTE.title);
  expect(trashedNote).toBeUndefined();
});

test("clear trash option should be disabled if trash is empty", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const trashItem = await app.navigation.findItem("Trash");

  const clearTrashMenuItem = await trashItem?.getClearTrashItem();
  expect(await clearTrashMenuItem?.isDisabled()).toBe(true);
});
