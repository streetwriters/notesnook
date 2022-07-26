/* eslint-disable no-undef */
const fs = require("fs");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env.local") });

const USER = {
  email: process.env.USER_EMAIL,
  NEW: {
    password: "",
    key: "",
  },
  CURRENT: {
    password: process.env.USER_PASSWORD,
    key: "",
  },
};

async function loginUser(user = USER, navigate = true) {
  if (navigate) await page.click(getTestId("navitem-login"));

  if (user.email) await page.fill(getTestId("email"), user.email);

  await page.fill(
    getTestId("password"),
    user.password || USER.CURRENT.password
  );

  await page.click(getTestId("submitButton"));

  await page.waitForSelector(getTestId("sync-status-completed"));
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

async function editNote(title, content, noDelay = false) {
  await page.waitForSelector(".ProseMirror");

  // await page.waitForTimeout(1000);

  if (title)
    await page.fill(getTestId("editor-title"), title, {
      strict: true,
      force: true,
    });

  if (content) {
    if (!noDelay) await page.waitForTimeout(100);

    await page.focus(".ProseMirror");

    await page.type(".ProseMirror", content);
  }

  if (!noDelay) await page.waitForTimeout(200);
}

async function downloadFile(downloadActionSelector, encoding) {
  return new Promise(async (resolve) => {
    page.on("download", async (download) => {
      const path = await download.path();
      resolve(fs.readFileSync(path, { encoding }));
    });
    await page.waitForSelector(downloadActionSelector);

    await page.click(downloadActionSelector);
  });
}

async function getEditorTitle() {
  return await page.inputValue(getTestId("editor-title"));
}

async function getEditorContent() {
  return (await page.innerText(".ProseMirror")).trim().replace(/\n+/gm, "\n");
}

async function getEditorContentAsHTML() {
  return await page.innerHTML(".ProseMirror");
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
