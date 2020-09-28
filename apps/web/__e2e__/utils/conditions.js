/* eslint-disable no-undef */

const { getTestId, NOTE } = require(".");
const List = require("./listitemidbuilder");

async function isPresent(selector) {
  try {
    await page.waitForSelector(selector, { state: "attached", timeout: 10000 });
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

async function isAbsent(selector) {
  try {
    await page.waitForSelector(selector, { state: "detached", timeout: 10000 });
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

async function isToastPresent() {
  return isPresent(getTestId("toast"));
}

async function checkNotePresence(index = 0, grouped = true, note = NOTE) {
  let noteSelector = List.new("note").atIndex(index).title();
  if (grouped) noteSelector = noteSelector.grouped();
  noteSelector = noteSelector.build();

  await page.waitForSelector(noteSelector);
  await expect(page.innerText(noteSelector)).resolves.toBe(note.title);
  return noteSelector;
}

module.exports = { isPresent, isAbsent, isToastPresent, checkNotePresence };
