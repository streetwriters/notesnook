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

import { test, expect, Page } from "@playwright/test";
import { AppModel } from "./models/app.model";
import { Sort } from "./models/base-view.model";
import { Item, Notebook } from "./models/types";
import { NOTE, NOTEBOOK } from "./utils";

async function populateList(page: Page) {
  const app = new AppModel(page);
  await app.goto();
  const notebooks = await app.goToNotebooks();
  let titles = ["G ", "C ", "Gz", "2 ", "A "];
  for (let title of titles) {
    NOTEBOOK.title = title + NOTEBOOK.title;
    const notebook = await notebooks.createNotebook(NOTEBOOK);
  }
  return { notebooks, app };
}

test("create a notebook", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notebooks = await app.goToNotebooks();

  const notebook = await notebooks.createNotebook(NOTEBOOK);

  expect(notebook).toBeDefined();
});

test("create a note inside a notebook", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notebooks = await app.goToNotebooks();
  const notebook = await notebooks.createNotebook(NOTEBOOK);
  const topics = await notebook?.openNotebook();
  const topic = await topics?.findItem({ title: NOTEBOOK.topics[0] });
  const notes = await topic?.open();

  const note = await notes?.createNote(NOTE);

  expect(note).toBeDefined();
});

test("edit a notebook", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notebooks = await app.goToNotebooks();
  const notebook = await notebooks.createNotebook(NOTEBOOK);

  const item: Notebook = {
    title: "An Edited Notebook",
    description: "A new edited description",
    topics: ["Topic 1", "Topic 2", "Topic 3"]
  };
  await notebook?.editNotebook(item);

  const editedNotebook = await notebooks.findNotebook(item);
  expect(editedNotebook).toBeDefined();
  expect(await editedNotebook?.getDescription()).toBe(item.description);
});

test("edit topics individually", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notebooks = await app.goToNotebooks();
  const notebook = await notebooks.createNotebook(NOTEBOOK);
  const topics = await notebook?.openNotebook();

  const editedTopics: Item[] = [];
  for (const title of NOTEBOOK.topics) {
    const topic = await topics?.findItem({ title });
    const editedTopic: Item = { title: `${title} (edited)` };
    await topic?.editItem(editedTopic);
    editedTopics.push(editedTopic);
  }

  for (const topic of editedTopics) {
    expect(await topics?.findItem(topic)).toBeDefined();
  }
});

test("delete a notebook", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notebooks = await app.goToNotebooks();
  const notebook = await notebooks.createNotebook(NOTEBOOK);

  await notebook?.moveToTrash();

  expect(await notebook?.isPresent()).toBe(false);
  expect(await app.toasts.waitForToast("1 notebook moved to trash")).toBe(true);
  const trash = await app.goToTrash();
  expect(await trash.findItem(NOTEBOOK.title)).toBeDefined();
});

test("delete a topic", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notebooks = await app.goToNotebooks();
  const notebook = await notebooks.createNotebook(NOTEBOOK);
  const topics = await notebook?.openNotebook();
  const topic = await topics?.findItem({ title: NOTEBOOK.topics[0] });

  await topic?.delete();

  expect(await app.toasts.waitForToast("1 topic deleted")).toBe(true);
  expect(await topics?.findItem({ title: NOTEBOOK.topics[0] })).toBeUndefined();
});

test("restore a notebook", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notebooks = await app.goToNotebooks();
  const notebook = await notebooks.createNotebook(NOTEBOOK);
  await notebook?.moveToTrash();
  const trash = await app.goToTrash();
  const trashItem = await trash.findItem(NOTEBOOK.title);

  await trashItem?.restore();

  await app.goToNotebooks();
  const restoredNotebook = await notebooks.findNotebook(NOTEBOOK);
  expect(restoredNotebook).toBeDefined();
  expect(await app.toasts.waitForToast("1 item restored")).toBe(true);
});

test("permanently delete a notebook", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notebooks = await app.goToNotebooks();
  const notebook = await notebooks.createNotebook(NOTEBOOK);
  await notebook?.moveToTrash();
  const trash = await app.goToTrash();
  const trashItem = await trash.findItem(NOTEBOOK.title);

  await trashItem?.delete();

  expect(await trashItem?.isPresent()).toBe(false);
});

test("pin a notebook", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notebooks = await app.goToNotebooks();
  const notebook = await notebooks.createNotebook(NOTEBOOK);

  await notebook?.pin();

  expect(await notebook?.isPinned()).toBe(true);
});

test("unpin a notebook", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notebooks = await app.goToNotebooks();
  const notebook = await notebooks.createNotebook(NOTEBOOK);
  await notebook?.pin();

  await notebook?.unpin();

  expect(await notebook?.isPinned()).toBe(false);
});

test("create shortcut of a notebook", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notebooks = await app.goToNotebooks();
  const notebook = await notebooks.createNotebook(NOTEBOOK);

  await notebook?.createShortcut();

  expect(await notebook?.isShortcut()).toBe(true);
  const allShortcuts = await app.navigation.getShortcuts();
  expect(allShortcuts.includes(NOTEBOOK.title)).toBeTruthy();
});

test("remove shortcut of a notebook", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notebooks = await app.goToNotebooks();
  const notebook = await notebooks.createNotebook(NOTEBOOK);
  await notebook?.createShortcut();

  await notebook?.removeShortcut();

  expect(await notebook?.isShortcut()).toBe(false);
  const allShortcuts = await app.navigation.getShortcuts();
  expect(allShortcuts.includes(NOTEBOOK.title)).toBeFalsy();
});

test("create shortcut of a topic", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notebooks = await app.goToNotebooks();
  const notebook = await notebooks.createNotebook(NOTEBOOK);
  const topics = await notebook?.openNotebook();
  const topic = await topics?.findItem({ title: NOTEBOOK.topics[0] });

  await topic?.createShortcut();

  expect(await topic?.isShortcut()).toBe(true);
  const allShortcuts = await app.navigation.getShortcuts();
  expect(allShortcuts.includes(NOTEBOOK.topics[0])).toBeTruthy();
});

test("remove shortcut of a topic", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notebooks = await app.goToNotebooks();
  const notebook = await notebooks.createNotebook(NOTEBOOK);
  const topics = await notebook?.openNotebook();
  const topic = await topics?.findItem({ title: NOTEBOOK.topics[0] });
  await topic?.createShortcut();

  await topic?.removeShortcut();

  expect(await topic?.isShortcut()).toBe(false);
  const allShortcuts = await app.navigation.getShortcuts();
  expect(allShortcuts.includes(NOTEBOOK.topics[0])).toBeFalsy();
});

test.setTimeout(100 * 1000);

test("sorting notebooks", async ({ page }) => {
  const { notebooks } = await populateList(page);

  const orderBy: Sort["orderBy"][] = ["ascendingOrder", "descendingOrder"];
  const sortBy: Sort["sortBy"][] = ["dateCreated", "dateEdited"];
  const groupBy: Sort["groupBy"][] = [
    "abc",
    "none",
    "default",
    "year",
    "month",
    "week"
  ];

  for (let group of groupBy) {
    for (let sort of sortBy) {
      for (let order of orderBy) {
        await notebooks?.sort({
          groupBy: group,
          orderBy: order,
          sortBy: sort
        });
        expect(await notebooks.isListFilled()).toBeTruthy();
      }
    }
  }
});
