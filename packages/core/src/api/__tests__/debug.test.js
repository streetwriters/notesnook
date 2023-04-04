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

import Debug from "../debug";
import { noteTest, notebookTest, databaseTest } from "../../../__tests__/utils";
import { enableFetchMocks, disableFetchMocks } from "jest-fetch-mock";

test("strip empty item shouldn't throw", () => {
  const debug = new Debug();
  expect(debug.strip()).toBe("{}");
});

test("strip note", () =>
  noteTest().then(({ db, id }) => {
    const note = db.notes.note(id)._note;
    const debug = new Debug();
    expect(debug.strip(normalizeItem(note))).toMatchSnapshot("stripped-note");
  }));

test("strip trashed note", () =>
  noteTest().then(async ({ db, id }) => {
    await db.notes.delete(id);
    const note = db.trash.all[0];
    const debug = new Debug();
    expect(debug.strip(normalizeItem(note))).toMatchSnapshot(
      "stripped-trashed-note"
    );
  }));

test("strip note with content", () =>
  noteTest().then(async ({ db, id }) => {
    const note = db.notes.note(id)._note;
    const debug = new Debug();

    const content = await db.content.raw(note.contentId);
    note.additionalData = {
      content: db.debug.strip(normalizeItem(content))
    };

    expect(debug.strip(normalizeItem(note))).toMatchSnapshot(
      "stripped-note-with-content"
    );
  }));

test("strip notebook", () =>
  notebookTest().then(async ({ db, id }) => {
    const notebook = db.notebooks.notebook(id)._notebook;
    const debug = new Debug();
    notebook.additionalData = notebook.topics.map((topic) =>
      normalizeItem(topic)
    );
    expect(debug.strip(normalizeItem(notebook))).toMatchSnapshot(
      "stripped-notebook"
    );
  }));

test("strip topic", () =>
  notebookTest().then(async ({ db, id }) => {
    const notebook = db.notebooks.notebook(id)._notebook;
    const debug = new Debug();
    expect(debug.strip(normalizeItem(notebook.topics[0]))).toMatchSnapshot(
      "stripped-topic"
    );
  }));

test("strip tag", () =>
  databaseTest().then(async (db) => {
    const tag = await db.tags.add("Hello tag");
    const debug = new Debug();
    expect(debug.strip(normalizeItem(tag))).toMatchSnapshot("stripped-tag");
  }));

test("reporting empty issue should return undefined", async () => {
  const debug = new Debug();
  expect(await debug.report()).toBeUndefined();
});

const SUCCESS_REPORT_RESPONSE = {
  url: "https://reported/"
};

test("reporting issue should return issue url", async () => {
  enableFetchMocks();

  const debug = new Debug();

  fetch.mockResponseOnce(JSON.stringify(SUCCESS_REPORT_RESPONSE), {
    headers: { "Content-Type": "application/json" }
  });

  expect(
    await debug.report({
      title: "I am title",
      body: "I am body",
      userId: "anything"
    })
  ).toBe(SUCCESS_REPORT_RESPONSE.url);

  disableFetchMocks();
});

test("reporting invalid issue should return undefined", async () => {
  enableFetchMocks();

  const debug = new Debug();

  fetch.mockResponseOnce(
    JSON.stringify({
      error_description: "Invalid issue."
    }),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );

  expect(await debug.report({})).toBeUndefined();

  disableFetchMocks();
});

function normalizeItem(item) {
  item.id = "hello";
  item.notebookId = "hello23";
  item.dateModified = 123;
  item.dateEdited = 123;
  item.dateCreated = 123;
  if (item.dateDeleted) item.dateDeleted = 123;
  if (item.contentId) item.contentId = "hello2";
  return item;
}
