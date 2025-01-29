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

import fs from "fs";
import dotenv from "dotenv";
import path, { join } from "path";
import { Locator, Page } from "@playwright/test";
import {
  GroupByOptions,
  Notebook,
  OrderByOptions,
  SortByOptions
} from "../models/types";
import { tmpdir } from "os";
import { AppModel } from "../models/app.model";

type Note = {
  title: string;
  content?: string;
};

dotenv.config({ path: path.join(__dirname, ".env.local") });

const USER = {
  NEW: {
    email: process.env.USER_EMAIL,
    password: process.env.NEW_USER_PASSWORD,
    key: process.env.NEW_USER_KEY,
    totpSecret: process.env.USER_TOTP_SECRET
  },
  CURRENT: {
    email: process.env.USER_EMAIL,
    password: process.env.USER_PASSWORD,
    key: process.env.USER_KEY,
    totpSecret: process.env.USER_TOTP_SECRET
  }
};

const NOTEBOOK: Notebook = {
  title: "Test notebook 1",
  description: "This is test notebook 1"
  // subNotebooks: [
  //   { title: "Sub notebook 1" },
  //   { title: "Very long sub notebook 2" },
  //   { title: "Sub notebook 3" }
  // ]
};

const NOTE: Note = {
  title: "Test 1",
  content: "This is " + "Test 1".repeat(10)
};

const TITLE_ONLY_NOTE: Note = {
  title: "Only a title"
};

const PASSWORD = "123abc123abc";

const APP_LOCK_PASSWORD = "lockapporelse🔪";

function getTestId(
  id: string,
  variant: "data-test-id" | "data-testid" = "data-test-id"
) {
  return `[${variant}="${id}"]`;
}

async function createNote(page: Page, note: Note) {
  await page.locator(getTestId("notes-action-button")).click();

  await editNote(page, note);
}

async function editNote(page: Page, note: Partial<Note>, noDelay = false) {
  const prosemirror = page.locator(".ProseMirror");

  if (note.title) {
    const title = page.locator(getTestId("editor-title"));
    await title.fill(note.title);
  }
  if (note.content) {
    if (!noDelay) await page.waitForTimeout(100);

    await prosemirror.focus();

    await prosemirror.type(note.content);
  }

  // a short delay so the note can be saved
  if (!noDelay) await page.waitForTimeout(200);
}

async function downloadAndReadFile(
  page: Page,
  action: () => Promise<void>,
  encoding: BufferEncoding | null | undefined = "utf-8"
) {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    action()
  ]);

  const dir = fs.mkdtempSync(join(tmpdir(), "nntests_"));
  const filePath = join(dir, download.suggestedFilename());
  await download.saveAs(filePath);

  const content = fs.readFileSync(filePath, encoding);

  fs.rmSync(dir, { force: true, recursive: true });

  return content;
}

async function uploadFile(page: Page, action: Locator, filename: string) {
  const [fileChooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    await action.click()
  ]);

  await fileChooser.setFiles(path.join(__dirname, "../data", filename));
}

function isTestAll() {
  return process.env.TEST_ALL === "true";
}

const orderByOptions: OrderByOptions[] = ["asc", "desc"];
const sortByOptions: SortByOptions[] = [
  "dateCreated",
  "dateEdited",
  "dateModified",
  "dateDeleted"
];
const groupByOptions: GroupByOptions[] = [
  "abc",
  "none",
  "default",
  "year",
  "month",
  "week"
];

export async function createHistorySession(page: Page, locked = false) {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  let note = await notes.createNote(NOTE);

  if (locked) {
    await note?.contextMenu.lock(PASSWORD);
    await note?.openLockedNote(PASSWORD);
  }

  const edits = ["Some edited text.", "Some more edited text."];
  for (const edit of edits) {
    await notes.editor.setContent(edit);

    await page.waitForTimeout(600);

    await page.reload().catch(console.error);
    await notes.waitForItem(NOTE.title);
    note = await notes.findNote(NOTE);
    locked ? await note?.openLockedNote(PASSWORD) : await note?.openNote();
  }
  const contents = [
    `${NOTE.content}${edits[0]}${edits[1]}`,
    `${NOTE.content}${edits[0]}`
  ];

  return {
    note,
    notes,
    app,
    contents
  };
}

export {
  USER,
  NOTE,
  TITLE_ONLY_NOTE,
  NOTEBOOK,
  PASSWORD,
  getTestId,
  createNote,
  editNote,
  downloadAndReadFile,
  uploadFile,
  isTestAll,
  orderByOptions,
  sortByOptions,
  groupByOptions,
  APP_LOCK_PASSWORD
};
