/* This file is part of the Notesnook project (https://notesnook.com/)
 *
 * Copyright (C) 2022 Streetwriters (Private) Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/* eslint-disable no-undef */

const { expect } = require("@playwright/test");
const { getTestId, NOTE, createNote } = require(".");
const List = require("./listitemidbuilder");
const Menu = require("./menuitemidbuilder");

async function isPresent(selector) {
  try {
    await page.waitForSelector(selector, { state: "attached", timeout: 10000 });
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

async function isAbsent(selector, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { state: "detached", timeout });
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

async function isToastPresent() {
  return isPresent(getTestId("toast"));
}

async function checkNotePresence(viewId, index = 0, note = NOTE) {
  let noteSelector = List.new("note").view(viewId).grouped().atIndex(index);
  // noteSelector = noteSelector.build();

  await page.waitForSelector(noteSelector.build(), { state: "attached" });

  await (await page.$(noteSelector.build())).scrollIntoViewIfNeeded();

  await expect(page.innerText(noteSelector.title().build())).resolves.toBe(
    note.title
  );
  return noteSelector.build();
}

async function createNoteAndCheckPresence(
  note = NOTE,
  viewId = "home",
  index = 0
) {
  await createNote(note, "notes");

  // make sure the note has saved.
  await page.waitForTimeout(200);

  let noteSelector = await checkNotePresence(viewId, index, note);

  await page.click(noteSelector, { button: "left" });

  return noteSelector;
}

async function checkMenuItemText(itemId, expectedText) {
  await expect(
    page.textContent(Menu.new("menuitem").item(itemId).build())
  ).resolves.toBe(expectedText);
}

module.exports = {
  isPresent,
  isAbsent,
  isToastPresent,
  checkNotePresence,
  createNoteAndCheckPresence,
  checkMenuItemText
};
