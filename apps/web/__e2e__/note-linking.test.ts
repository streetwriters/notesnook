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
import { NOTE } from "./utils";
import { test, expect } from "@nn/test";

test("linking to a non-existent note creates it and inserts the link", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  await notes.createNote(NOTE);

  const linkTitle = "A brand new linked note";
  const dialog = await notes.editor.openNoteLinkDialog();
  await dialog.search(linkTitle);

  // typed title matches no existing note, so the create action is offered
  expect(await dialog.isCreateNoteVisible()).toBe(true);
  await dialog.createNote();

  // the internal link is inserted into the current note...
  const link = notes.editor.content.locator('a[href^="nn://note/"]', {
    hasText: linkTitle
  });
  await expect(link).toBeVisible();

  // ...and the target note actually exists in the notes list
  await notes.waitForItem(linkTitle);
  expect(await notes.findNote({ title: linkTitle })).toBeDefined();
});

test("linking to an existing note does not offer to create it", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  await notes.createNote(NOTE);

  const dialog = await notes.editor.openNoteLinkDialog();
  // exact (case-insensitive) title of an existing note
  await dialog.search(NOTE.title.toLowerCase());

  expect(await dialog.isCreateNoteVisible()).toBe(false);
});
