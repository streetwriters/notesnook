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

const { test, expect } = require("@playwright/test");
const { NOTE, getTestId, getEditorContent, editNote } = require("./utils");
const { createNoteAndCheckPresence, isPresent } = require("./utils/conditions");
const List = require("./utils/listitemidbuilder");

/**
 * @type {import("@playwright/test").Page}
 */
var page = null;
global.page = null;
test.beforeEach(async ({ page: _page, baseURL }) => {
  global.page = _page;
  page = _page;
  await page.goto(baseURL);
  await page.waitForSelector(getTestId("routeHeader"));
});

async function createAndEditNote() {
  const noteSelector = await createNoteAndCheckPresence();

  await page.click(getTestId("notes-action-button"));

  await page.click(noteSelector);

  await editNote(null, "Some edited text.");

  return noteSelector;
}

test("editing a note should create a new session in its session history", async () => {
  await createAndEditNote();

  await page.click(getTestId("properties"));

  for (let i = 0; i < 2; ++i) {
    expect(await isPresent(List.new("session").atIndex(i).build())).toBe(true);
  }
});

test("switching sessions should change editor content", async () => {
  await createAndEditNote();

  await page.click(getTestId("properties"));

  await page.click(List.new("session").atIndex(1).build());

  expect(await getEditorContent()).toBe(NOTE.content);

  await page.click(getTestId("properties"));

  await page.click(List.new("session").atIndex(0).build());

  expect(await getEditorContent()).toBe(`Some edited text.${NOTE.content}`);
});

test("cancelling session restore should bring editor content back to original", async () => {
  await createAndEditNote();

  await page.click(getTestId("properties"));

  await page.click(List.new("session").atIndex(1).build());

  expect(await getEditorContent()).toBe(NOTE.content);

  await page.click(getTestId("editor-notice-cancel"));

  expect(await getEditorContent()).toBe(`Some edited text.${NOTE.content}`);
});

test("restoring a session should change note's content", async () => {
  const noteSelector = await createAndEditNote();

  await page.click(getTestId("properties"));

  await page.click(List.new("session").atIndex(1).build());

  expect(await getEditorContent()).toBe(NOTE.content);

  await page.click(getTestId("editor-notice-action"));

  expect(await getEditorContent()).toBe(NOTE.content);

  await page.click(getTestId("notes-action-button"));

  await page.click(noteSelector);

  expect(await getEditorContent()).toBe(NOTE.content);
});
