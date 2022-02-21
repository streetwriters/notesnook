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
  checkMenuItemText,
};
