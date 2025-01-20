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

import { expect, Page, test } from "@playwright/test";
import { AppModel } from "./models/app.model";
import { NoteItemModel } from "./models/note-item.model";

async function populateList(page: Page, count = 5) {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const notesList: NoteItemModel[] = [];
  for (let i = 0; i < count; ++i) {
    const note = await notes.createNote({
      title: `Test note ${i}`
      // content: `Test note ${i}`.repeat(10)
    });
    if (!note) continue;
    notesList.push(note);
  }
  return { notes, app, notesList: notesList.reverse() };
}

test.setTimeout(30 * 1000);

test("ctrl+a should select all notes", async ({ page }) => {
  const { notesList, notes } = await populateList(page);
  await notes.focus();

  await notes.press("ControlOrMeta+a");

  for (const note of notesList) {
    expect(await note.isSelected()).toBeTruthy();
  }
});

test("right clicking on selected notes should open multi-selection menu", async ({
  page
}) => {
  const { notesList, notes } = await populateList(page);
  await notes.focus();
  await notes.press("ControlOrMeta+a");

  await notesList[1].contextMenu.open();

  expect(await notesList[1].contextMenu.title()).toBe(
    `${notesList.length} items selected`
  );
});

test("pressing Escape should deselect all items", async ({ page }) => {
  const { notesList, notes } = await populateList(page);
  await notes.focus();
  await notes.press("ControlOrMeta+a");

  await notes.press("Escape");

  let selected = 0;
  for (const note of notesList) {
    if (await note.isSelected()) ++selected;
  }
  expect(selected).toBeLessThanOrEqual(1);
});

test("pressing ArrowDown should focus next note", async ({ page }) => {
  const { notesList, notes } = await populateList(page);
  await notes.focus();

  await notes.press("ArrowDown");

  expect(await notesList[1].isFocused()).toBeTruthy();
});

test("pressing ArrowUp should focus prev note", async ({ page }) => {
  const { notesList, notes } = await populateList(page);
  await notes.focus();
  await notes.press("ArrowDown");
  await notes.press("ArrowDown");

  await notes.press("ArrowUp");

  expect(await notesList[1].isFocused()).toBeTruthy();
});

test("pressing Space should open focused note", async ({ page }) => {
  const { notesList, notes } = await populateList(page);
  await notes.focus();
  await notes.press("ArrowDown");
  await notes.press("ArrowDown");

  await notes.press("Space");

  expect(await notes.editor.getTitle()).toBe(await notesList[2].getTitle());
});

test("pressing Enter should open focused note", async ({ page }) => {
  const { notesList, notes } = await populateList(page);
  await notes.focus();
  await notes.press("ArrowDown");
  await notes.press("ArrowDown");

  await notes.press("Enter");

  expect(await notes.editor.getTitle()).toBe(await notesList[2].getTitle());
});

test("pressing Shift+ArrowDown should select next note", async ({ page }) => {
  const { notesList, notes } = await populateList(page);
  await notes.focus();

  await notes.press("Shift+ArrowDown");
  await notes.press("Shift+ArrowDown");

  expect(await notesList[0].isSelected()).toBeTruthy();
  expect(await notesList[1].isSelected()).toBeTruthy();
  expect(await notesList[2].isSelected()).toBeTruthy();
  expect(await notesList[3].isSelected()).toBeFalsy();
});

test("pressing Shift+ArrowUp should select previous note", async ({ page }) => {
  const { notesList, notes } = await populateList(page);
  await notes.focus();
  await notes.press("ArrowDown");
  await notes.press("ArrowDown");

  await notes.press("Shift+ArrowUp");
  await notes.press("Shift+ArrowUp");
  await notes.press("Shift+ArrowUp");

  expect(await notesList[0].isSelected()).toBeTruthy();
  expect(await notesList[1].isSelected()).toBeTruthy();
  expect(await notesList[2].isSelected()).toBeTruthy();
  expect(await notesList[3].isSelected()).toBeFalsy();
});

test("use Shift+ArrowUp & Shift+ArrowDown for note selection", async ({
  page
}, info) => {
  info.setTimeout(60 * 1000);

  const { notesList, notes } = await populateList(page, 10);
  await notes.focus();
  // move focus 5 items down
  for (let i = 0; i < 5; ++i) {
    await notes.press("ArrowDown");
  }

  // select 5 items in the upward direction
  for (let i = 0; i < 5; ++i) {
    await notes.press("Shift+ArrowUp");
  }

  // ensure the first 5 items are selected
  for (let i = 0; i <= 5; ++i) {
    expect(await notesList[i].isSelected()).toBeTruthy();
  }

  // deselect 5 items downward
  for (let i = 0; i <= 5; ++i) {
    await notes.press("Shift+ArrowDown");
  }

  // ensure the first 4 items are deselected (5th item is the anchor)
  for (let i = 0; i < 5; ++i) {
    expect(await notesList[i].isSelected()).toBeFalsy();
  }

  // select 5 items downward
  for (let i = 0; i <= 5; ++i) {
    await notes.press("Shift+ArrowDown");
  }

  // ensure the last 5 items are selected
  for (let i = 5; i < 10; ++i) {
    expect(await notesList[i].isSelected()).toBeTruthy();
  }

  // deselect the last 5 items upward
  for (let i = 0; i <= 5; ++i) {
    await notes.press("Shift+ArrowUp");
  }

  // ensure the last 4 items were deselected (5th is anchor)
  for (let i = 6; i < 10; ++i) {
    expect(await notesList[i].isSelected()).toBeFalsy();
  }
  expect(await notesList[5].isSelected()).toBeTruthy();
});

test("select notes using Control+Click", async ({ page }, info) => {
  info.setTimeout(60 * 1000);

  const { notesList, notes } = await populateList(page, 10);
  await notes.focus();

  await page.keyboard.down("ControlOrMeta");
  for (let i = 2; i < 10; i += 2) {
    await notesList[i].click();
  }
  await page.keyboard.up("ControlOrMeta");

  for (let i = 2; i < 10; i += 2) {
    expect(await notesList[i].isSelected()).toBeTruthy();
  }
});

test("select notes using Shift+Click downwards", async ({ page }, info) => {
  info.setTimeout(60 * 1000);

  const { notesList, notes } = await populateList(page, 10);
  await notes.focus();

  await page.keyboard.down("Shift");
  await notesList[5].click();
  await page.keyboard.up("Shift");

  for (let i = 0; i <= 5; i++) {
    expect(await notesList[i].isSelected()).toBeTruthy();
  }
  expect(await notesList[6].isSelected()).toBeFalsy();
});

test("select notes using Shift+Click upwards", async ({ page }, info) => {
  info.setTimeout(60 * 1000);

  const { notesList, notes } = await populateList(page, 10);
  await notes.focus();

  for (let i = 0; i < 5; ++i) {
    await notes.press("ArrowDown");
  }

  await page.keyboard.down("Shift");
  await notesList[0].click();
  await page.keyboard.up("Shift");

  for (let i = 0; i <= 5; i++) {
    expect(await notesList[i].isSelected()).toBeTruthy();
  }
  expect(await notesList[0].isFocused()).toBeTruthy();
});

test("using Shift+Click when no notes are selected should not crash the app", async ({
  page
}, info) => {
  info.setTimeout(60 * 1000);

  const { notes } = await populateList(page, 5);
  await notes.focus();

  const note = await notes.findNote({ title: "Test note 3" });

  await page.keyboard.down("Shift");
  await note?.click();
  await page.keyboard.up("Shift");

  expect(await notes.isEmpty()).toBeFalsy();
});

test("Ctrl+Click to select/unselect notes", async ({ page }, info) => {
  info.setTimeout(60 * 1000);
  const { notesList, notes } = await populateList(page, 10);
  await notes.focus();

  await page.keyboard.down("ControlOrMeta");
  for (let i = 2; i < 10; i += 2) {
    await notesList[i].click();
  }
  await page.keyboard.up("ControlOrMeta");

  for (let i = 2; i < 10; i += 2) {
    expect(await notesList[i].isSelected()).toBeTruthy();
  }

  const selectedNote = notesList[2];
  await selectedNote.contextMenu.open();
  expect(
    (await selectedNote.contextMenu.title()) === `5 items selected`
  ).toBeTruthy();
  await selectedNote.contextMenu.close();

  await page.keyboard.down("ControlOrMeta");
  for (let i = 2; i < 10; i += 2) {
    await notesList[i].click();
  }
  await page.keyboard.up("ControlOrMeta");

  for (let i = 2; i < 10; i += 2) {
    expect(await notesList[i].isSelected()).toBeFalsy();
  }

  await selectedNote.contextMenu.open();
  expect(await selectedNote.contextMenu.title()).toBeFalsy();
});

test("opening a note & right clicking on another note should show note properties menu", async ({
  page
}, info) => {
  info.setTimeout(60 * 1000);
  const { notesList, notes } = await populateList(page, 10);
  await notes.focus();

  const noteSelected = 4;
  const selectedNote = notesList[noteSelected];

  await notesList[0].click();
  await selectedNote.contextMenu.open();
  expect(await selectedNote.contextMenu.title()).toBeFalsy();
});
