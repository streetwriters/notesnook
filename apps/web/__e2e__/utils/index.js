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

  await page.waitForSelector(".tox-edit-area__iframe");

  await page.fill(getTestId("editor-title"), note.title);

  const frameElement = await page.$("iframe.tox-edit-area__iframe");

  const frame = await frameElement.contentFrame();

  await frame.click("html");

  await frame.type("html", note.content);

  await frame.type("body", note.content);
}

module.exports = {
  NOTE,
  NOTEBOOK,
  getTestId,
  createNote,
};
