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
import { NOTE } from "./utils";

test("ask for image compression during image upload when 'Image Compression' setting is 'Ask every time'", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const settings = await app.goToSettings();
  await settings.selectImageCompression({
    value: "0",
    label: "Ask every time"
  });
  await settings.close();

  const notes = await app.goToNotes();
  await notes.createNote(NOTE);
  await notes.editor.attachImage();

  await expect(page.getByText("Enable compression")).toBeVisible();
});

test("do not ask for image compression during image upload when 'Image Compression' setting is 'Enable (Recommended)'", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const settings = await app.goToSettings();
  await settings.selectImageCompression({
    value: "1",
    label: "Enable (Recommended)"
  });
  await settings.close();

  const notes = await app.goToNotes();
  await notes.createNote(NOTE);
  await notes.editor.attachImage();

  await expect(page.getByText("Enable compression")).toBeHidden();
});

test("do not ask for image compression during image upload when 'Image Compression' setting is 'Disable'", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const settings = await app.goToSettings();
  await settings.selectImageCompression({
    value: "2",
    label: "Disable"
  });
  await settings.close();

  const notes = await app.goToNotes();
  await notes.createNote(NOTE);
  await notes.editor.attachImage();

  await expect(page.getByText("Enable compression")).toBeHidden();
});
