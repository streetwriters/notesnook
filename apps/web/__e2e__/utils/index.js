/* eslint-disable no-undef */
const fs = require("fs");

const NOTEBOOK = {
  title: "Test notebook 1",
  description: "This is test notebook 1",
  topics: ["Topic 1", "Very long topic 2", "Topic 3"],
};

const NOTE = {
  title: "Test 1",
  content: "This is " + "Test 1".repeat(10),
};

const PASSWORD = "123abc123abc";

function getTestId(id) {
  return `[data-test-id="${id}"]`;
}

async function createNote(note, actionButtonId) {
  await page.click(getTestId(actionButtonId + "-action-button"));

  await editNote(note.title, note.content);
}

async function editNote(title, content) {
  await page.waitForSelector(".mce-content-body");

  // await page.waitForTimeout(1000);

  if (title)
    await page.fill(getTestId("editor-title"), title, {
      strict: true,
      force: true,
    });

  if (content) {
    await page.waitForTimeout(100);

    await page.focus(".mce-content-body");

    await page.type(".mce-content-body", content);
  }

  await page.waitForTimeout(200);
}

async function downloadFile(downloadActionSelector, encoding) {
  return new Promise(async (resolve) => {
    page.on("download", async (download) => {
      const path = await download.path();
      resolve(fs.readFileSync(path, { encoding }).toString());
    });
    await page.waitForSelector(downloadActionSelector);

    await page.click(downloadActionSelector);
  });
}

async function getEditorTitle() {
  return await page.inputValue(getTestId("editor-title"));
}

async function getEditorContent() {
  return (await page.innerText(".mce-content-body"))
    .trim()
    .replace(/\n+/gm, "\n");
}

async function getEditorContentAsHTML() {
  return await page.innerHTML(".mce-content-body");
}

function isTestAll() {
  return process.env.TEST_ALL === "true";
}

module.exports = {
  NOTE,
  NOTEBOOK,
  PASSWORD,
  getTestId,
  createNote,
  editNote,
  downloadFile,
  getEditorTitle,
  getEditorContent,
  getEditorContentAsHTML,
  isTestAll,
};
