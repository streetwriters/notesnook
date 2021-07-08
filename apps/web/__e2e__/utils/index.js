/* eslint-disable no-undef */

const NOTEBOOK = {
  title: "Test notebook 1",
  description: "This is test notebook 1",
  topics: ["Topic 1", "Very long topic 2", "Topic 3"],
};

const NOTE = {
  title: "Test 1",
  content: "This is " + "Test 1".repeat(10),
};

function getTestId(id) {
  return `[data-test-id="${id}"]`;
}

async function createNote(note, actionButtonId) {
  await page.click(getTestId(actionButtonId + "-action-button"));

  await page.waitForSelector(".mce-content-body");

  await page.fill(getTestId("editor-title"), note.title);

  await page.waitForTimeout(100);

  await page.focus(".mce-content-body");

  await page.type(".mce-content-body", note.content);
}

module.exports = {
  NOTE,
  NOTEBOOK,
  getTestId,
  createNote,
};
