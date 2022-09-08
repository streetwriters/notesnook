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

/* eslint-disable no-undef */
const fs = require("fs");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env.local") });

const USER = {
  email: process.env.USER_EMAIL,
  NEW: {
    password: process.env.NEW_USER_PASSWORD,
    key: process.env.NEW_USER_KEY
  },
  CURRENT: {
    password: process.env.CURRENT_USER_PASSWORD,
    key: process.env.CURRENT_USER_KEY
  }
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
  topics: ["Topic 1", "Very long topic 2", "Topic 3"]
};

const NOTE = {
  title: "Test 1",
  content: "This is " + "Test 1".repeat(10)
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
      force: true
    });

  if (content) {
    if (!noDelay) await page.waitForTimeout(100);

    await page.focus(".ProseMirror");

    await page.type(".ProseMirror", content);
  }

  if (!noDelay) await page.waitForTimeout(200);
}

async function downloadFile(downloadActionSelector, encoding) {
  await page.waitForSelector(downloadActionSelector);

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    await page.click(downloadActionSelector)
  ]);
  const path = await download.path();
  return fs.readFileSync(path, { encoding });
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
  loginUser
};
