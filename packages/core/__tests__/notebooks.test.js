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

import { notebookTest, TEST_NOTEBOOK, TEST_NOTE, delay } from "./utils";
import { makeTopic } from "../src/collections/topics";
import { test, expect } from "vitest";
import qclone from "qclone";

test("add a notebook", () =>
  notebookTest().then(({ db, id }) => {
    expect(id).toBeDefined();
    let notebook = db.notebooks.notebook(id);
    expect(notebook).toBeDefined();
    expect(notebook.title).toBe(TEST_NOTEBOOK.title);
  }));

test("get all notebooks", () =>
  notebookTest().then(({ db }) => {
    expect(db.notebooks.all.length).toBeGreaterThan(0);
  }));

test("pin a notebook", () =>
  notebookTest().then(async ({ db, id }) => {
    let notebook = db.notebooks.notebook(id);
    await notebook.pin();
    notebook = db.notebooks.notebook(id);
    expect(notebook.data.pinned).toBe(true);
  }));

test("unpin a notebook", () =>
  notebookTest().then(async ({ db, id }) => {
    let notebook = db.notebooks.notebook(id);
    await notebook.pin();
    notebook = db.notebooks.notebook(id);
    expect(notebook.data.pinned).toBe(true);
    await notebook.pin();
    notebook = db.notebooks.notebook(id);
    expect(notebook.data.pinned).toBe(false);
  }));

test("updating notebook with empty title should throw", () =>
  notebookTest().then(async ({ db, id }) => {
    await expect(db.notebooks.add({ id, title: "" })).rejects.toThrow();
  }));

test("merge notebook with new topics", () =>
  notebookTest().then(async ({ db, id }) => {
    let notebook = db.notebooks.notebook(id);

    const newNotebook = db.notebooks.merge(notebook.data, {
      ...notebook.data,
      topics: [...notebook.data.topics, makeTopic("Home", id)],
      remote: true
    });

    expect(
      newNotebook.topics.findIndex((t) => t.title === "Home")
    ).toBeGreaterThanOrEqual(0);
    expect(
      newNotebook.topics.findIndex((t) => t.title === "hello")
    ).toBeGreaterThanOrEqual(0);
  }));

test("merge notebook with topics removed", () =>
  notebookTest().then(async ({ db, id }) => {
    let notebook = db.notebooks.notebook(id);

    const newNotebook = db.notebooks.merge(notebook.data, {
      ...notebook.data,
      topics: [makeTopic("Home", id)],
      remote: true
    });

    expect(
      newNotebook.topics.findIndex((t) => t.title === "Home")
    ).toBeGreaterThanOrEqual(0);
    expect(
      newNotebook.topics.findIndex((t) => t.title === "hello")
    ).toBeLessThan(0);
  }));

test("merge notebook with topic edited", () =>
  notebookTest().then(async ({ db, id }) => {
    let notebook = db.notebooks.notebook(id);

    const newNotebook = db.notebooks.merge(notebook.data, {
      ...notebook.data,
      topics: [{ ...notebook.data.topics[0], title: "hello (edited)" }],
      remote: true
    });

    expect(
      newNotebook.topics.findIndex((t) => t.title === "hello (edited)")
    ).toBeGreaterThanOrEqual(0);
    expect(
      newNotebook.topics.findIndex((t) => t.title === "hello")
    ).toBeLessThan(0);
  }));

test("merge notebook when local notebook is also edited", () =>
  notebookTest().then(async ({ db, id }) => {
    let notebook = db.notebooks.notebook(id);

    let newNotebook = { ...qclone(notebook.data), remote: true };
    newNotebook.topics[0].title = "hello (edited)";

    await delay(500);

    await notebook.topics.add({
      ...notebook.topics.all[0],
      title: "hello (edited too)"
    });

    newNotebook = db.notebooks.merge(
      db.notebooks.notebook(id).data,
      newNotebook,
      0
    );
    expect(
      newNotebook.topics.findIndex((t) => t.title === "hello (edited too)")
    ).toBeGreaterThanOrEqual(0);
    expect(
      newNotebook.topics.findIndex((t) => t.title === "hello (edited)")
    ).toBeLessThan(0);
    expect(
      newNotebook.topics.findIndex((t) => t.title === "hello")
    ).toBeLessThan(0);
  }));

test("merging notebook when local notebook is not edited should not update remote notebook dateEdited", () =>
  notebookTest().then(async ({ db, id }) => {
    let notebook = db.notebooks.notebook(id);

    let note = await db.notes.add(TEST_NOTE);
    await db.notes.addToNotebook(
      { id: notebook.data.id, topic: notebook.data.topics[0].id },
      note
    );

    const newNotebook = db.notebooks.merge(notebook.data, {
      ...notebook.data,
      remote: true
    });

    expect(db.notebooks.notebook(id).dateEdited).toBe(newNotebook.dateEdited);
  }));

test("merge notebook with topic removed that is edited in the local notebook", () =>
  notebookTest().then(async ({ db, id }) => {
    let notebook = db.notebooks.notebook(id);

    let newNotebook = { ...qclone(notebook.data), remote: true };
    newNotebook.topics.splice(0, 1); // remove hello topic

    const lastSynced = Date.now();

    await delay(500);

    await notebook.topics.add({
      ...notebook.topics.all[1],
      title: "hello (i exist)"
    });

    newNotebook = db.notebooks.merge(
      db.notebooks.notebook(id).data,
      newNotebook,
      lastSynced
    );

    expect(
      newNotebook.topics.findIndex((t) => t.title === "hello (i exist)")
    ).toBeGreaterThanOrEqual(0);
    expect(
      newNotebook.topics.findIndex((t) => t.title === "hello")
    ).toBeLessThan(0);
  }));
