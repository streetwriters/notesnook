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

    const newNotebook = { ...notebook.data, remote: true };
    newNotebook.topics.push(makeTopic("Home", id));

    await expect(db.notebooks.merge(newNotebook)).resolves.not.toThrow();

    expect(notebook.topics.has("Home")).toBe(true);
    expect(notebook.topics.has("hello")).toBe(true);
  }));

test("merge notebook with topics removed", () =>
  notebookTest().then(async ({ db, id }) => {
    let notebook = db.notebooks.notebook(id);

    const newNotebook = { ...notebook.data, remote: true };
    newNotebook.topics.splice(0, 1); // remove hello topic
    newNotebook.topics.push(makeTopic("Home", id));

    await expect(db.notebooks.merge(newNotebook)).resolves.not.toThrow();

    expect(notebook.topics.has("Home")).toBe(true);
    expect(notebook.topics.has("hello")).toBe(false);
  }));

test("merge notebook with topic edited", () =>
  notebookTest().then(async ({ db, id }) => {
    let notebook = db.notebooks.notebook(id);

    const newNotebook = { ...notebook.data, remote: true };
    newNotebook.topics[0].title = "hello (edited)";

    await expect(db.notebooks.merge(newNotebook)).resolves.not.toThrow();

    expect(notebook.topics.has("hello (edited)")).toBe(true);
    expect(notebook.topics.has("hello")).toBe(false);
  }));

test("merge notebook when local notebook is also edited", () =>
  notebookTest().then(async ({ db, id }) => {
    let notebook = db.notebooks.notebook(id);

    const newNotebook = { ...notebook.data, remote: true };
    newNotebook.topics[0].title = "hello (edited)";

    await delay(500);

    await notebook.topics.add({
      ...notebook.topics.all[0],
      title: "hello (edited too)"
    });

    await expect(db.notebooks.merge(newNotebook)).resolves.not.toThrow();

    expect(notebook.topics.has("hello (edited too)")).toBe(true);
    expect(notebook.topics.has("hello (edited)")).toBe(false);
    expect(notebook.topics.has("hello")).toBe(false);
  }));

test("merging notebook when local notebook is not edited should not update remote notebook dateEdited", () =>
  notebookTest().then(async ({ db, id }) => {
    let notebook = db.notebooks.notebook(id);

    let note = await db.notes.add(TEST_NOTE);
    await db.notes.addToNotebook(
      { id: notebook.data.id, topic: notebook.data.topics[0].id },
      note
    );

    const newNotebook = { ...notebook.data, remote: true };

    await expect(db.notebooks.merge(newNotebook)).resolves.not.toThrow();

    expect(db.notebooks.notebook(id).dateEdited).toBe(newNotebook.dateEdited);
  }));

test("merge notebook with topic removed that is edited in the local notebook", () =>
  notebookTest().then(async ({ db, id }) => {
    let notebook = db.notebooks.notebook(id);

    const newNotebook = { ...notebook.data, remote: true };
    newNotebook.topics.splice(0, 1); // remove hello topic

    await db.storage.write("lastSynced", Date.now());

    await delay(500);

    await notebook.topics.add({
      ...notebook.topics.all[1],
      title: "hello (i exist)"
    });

    await expect(db.notebooks.merge(newNotebook)).resolves.not.toThrow();

    expect(notebook.topics.has("hello (i exist)")).toBe(true);
    expect(notebook.topics.has("hello")).toBe(false);
  }));
