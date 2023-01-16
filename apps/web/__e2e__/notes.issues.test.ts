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

import { expect, test } from "@playwright/test";
import { AppModel } from "./models/app.model";
import { NOTE } from "./utils";
test.skip("TODO: make sure jump to group works", () => {});

test("#1002 Can't add a tag that's a substring of an existing tag", async ({
  page
}) => {
  const tags = ["chromeos-105", "chromeos"];
  const app = new AppModel(page);
  await app.goto();
  const tagsView = await app.goToTags();
  await tagsView.createItem({ title: "chromeos-105" });
  const notes = await app.goToNotes();
  await notes.createNote(NOTE);

  await notes.editor.setTags(tags);

  const noteTags = await notes.editor.getTags();
  expect(noteTags).toHaveLength(tags.length);
  expect(noteTags.every((t, i) => t === tags[i])).toBe(true);
});
