/* eslint-disable no-undef */
const fs = require("fs");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env.local") });

const USER = {
  email: process.env.USER_EMAIL,
  password: process.env.USER_PASSWORD,
};

async function loginUser(user = USER, navigate = true) {
  if (navigate) await page.click(getTestId("navitem-login"));

  await page.fill(getTestId("email"), user.email);

  await page.fill(getTestId("password"), user.password);

  await page.click(getTestId("submitButton"));

  await page.waitForSelector(getTestId("navitem-sync"));
}

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
  USER,
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
  loginUser,
};
