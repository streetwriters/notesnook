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

import { test, expect, Page } from "@playwright/test";
import { AppModel } from "./models/app.model";
import { NoteItemModel } from "./models/note-item.model";
import { getTestId } from "./utils";

async function populateList(page: Page) {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const notesList: NoteItemModel[] = [];
  let titles = ["G ", "C ", "Gz", "2 ", "A "];
  for (let title of titles) {
    const note = await notes.createNote({
      title: `${title} is Title`,
      content: "This is test".repeat(10)
    });
    if (!note) continue;
    notesList.push(note);
  }
  return { notes, app, notesList: notesList.reverse() };
}

test.setTimeout(100 * 1000);

test("sorting notes", async ({ page }) => {
  const { notesList, notes } = await populateList(page);

  //extra
  await notes.sort({
    groupBy: "abc",
    orderBy: "ascendingOrder",
    sortBy: "dateCreated"
  });

  //ascending descending order
  await notes.sort({
    groupBy: "abc",
    orderBy: "ascendingOrder",
    sortBy: "dateCreated"
  });
  expect(await isLengthCorrect(page)).toBeTruthy();
  await notes.sort({
    groupBy: "abc",
    orderBy: "descendingOrder",
    sortBy: "dateCreated"
  });
  expect(await isLengthCorrect(page)).toBeTruthy();
  await notes.sort({
    groupBy: "default",
    orderBy: "ascendingOrder",
    sortBy: "dateCreated"
  });
  expect(await isLengthCorrect(page)).toBeTruthy();
  await notes.sort({
    groupBy: "default",
    orderBy: "descendingOrder",
    sortBy: "dateCreated"
  });
  expect(await isLengthCorrect(page)).toBeTruthy();
  await notes.sort({
    groupBy: "month",
    orderBy: "ascendingOrder",
    sortBy: "dateCreated"
  });
  expect(await isLengthCorrect(page)).toBeTruthy();
  await notes.sort({
    groupBy: "month",
    orderBy: "descendingOrder",
    sortBy: "dateCreated"
  });
  expect(await isLengthCorrect(page)).toBeTruthy();
  await notes.sort({
    groupBy: "none",
    orderBy: "ascendingOrder",
    sortBy: "dateCreated"
  });
  expect(await isLengthCorrect(page)).toBeTruthy();
  await notes.sort({
    groupBy: "none",
    orderBy: "descendingOrder",
    sortBy: "dateCreated"
  });
  expect(await isLengthCorrect(page)).toBeTruthy();
  await notes.sort({
    groupBy: "week",
    orderBy: "ascendingOrder",
    sortBy: "dateCreated"
  });
  expect(await isLengthCorrect(page)).toBeTruthy();
  await notes.sort({
    groupBy: "week",
    orderBy: "descendingOrder",
    sortBy: "dateCreated"
  });
  expect(await isLengthCorrect(page)).toBeTruthy();
  await notes.sort({
    groupBy: "year",
    orderBy: "ascendingOrder",
    sortBy: "dateCreated"
  });
  expect(await isLengthCorrect(page)).toBeTruthy();
  await notes.sort({
    groupBy: "year",
    orderBy: "descendingOrder",
    sortBy: "dateCreated"
  });
  expect(await isLengthCorrect(page)).toBeTruthy();

  //dateEdited
  await notes.sort({
    groupBy: "abc",
    orderBy: "ascendingOrder",
    sortBy: "dateEdited"
  });
  expect(await isLengthCorrect(page)).toBeTruthy();
  await notes.sort({
    groupBy: "abc",
    orderBy: "descendingOrder",
    sortBy: "dateEdited"
  });
  expect(await isLengthCorrect(page)).toBeTruthy();
  await notes.sort({
    groupBy: "default",
    orderBy: "ascendingOrder",
    sortBy: "dateEdited"
  });
  expect(await isLengthCorrect(page)).toBeTruthy();
  await notes.sort({
    groupBy: "default",
    orderBy: "descendingOrder",
    sortBy: "dateEdited"
  });
  expect(await isLengthCorrect(page)).toBeTruthy();
  await notes.sort({
    groupBy: "month",
    orderBy: "ascendingOrder",
    sortBy: "dateEdited"
  });
  expect(await isLengthCorrect(page)).toBeTruthy();
  await notes.sort({
    groupBy: "month",
    orderBy: "descendingOrder",
    sortBy: "dateEdited"
  });
  expect(await isLengthCorrect(page)).toBeTruthy();
  await notes.sort({
    groupBy: "none",
    orderBy: "ascendingOrder",
    sortBy: "dateEdited"
  });
  expect(await isLengthCorrect(page)).toBeTruthy();
  await notes.sort({
    groupBy: "none",
    orderBy: "descendingOrder",
    sortBy: "dateEdited"
  });
  expect(await isLengthCorrect(page)).toBeTruthy();
  await notes.sort({
    groupBy: "week",
    orderBy: "ascendingOrder",
    sortBy: "dateEdited"
  });
  expect(await isLengthCorrect(page)).toBeTruthy();
  await notes.sort({
    groupBy: "week",
    orderBy: "descendingOrder",
    sortBy: "dateEdited"
  });
  expect(await isLengthCorrect(page)).toBeTruthy();
  await notes.sort({
    groupBy: "year",
    orderBy: "ascendingOrder",
    sortBy: "dateEdited"
  });
  expect(await isLengthCorrect(page)).toBeTruthy();
  await notes.sort({
    groupBy: "year",
    orderBy: "descendingOrder",
    sortBy: "dateEdited"
  });
  expect(await isLengthCorrect(page)).toBeTruthy();
});

async function isLengthCorrect(page: Page) {
  let itemCount = await page.locator(getTestId("list-item")).count();
  if (itemCount !== 5) return false;
  return true;
}
