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

import { test, expect } from "@playwright/test";
import { AppModel } from "./models/app.model";
import { Notebook } from "./models/types";
import {
  groupByOptions,
  NOTE,
  NOTEBOOK,
  orderByOptions,
  sortByOptions
} from "./utils";

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
  const notes = await notebook?.openNotebook();
  await notes?.waitForList();

  const note = await notes?.createNote(NOTE);

  expect(note).toBeDefined();
});

test("create a note inside a subnotebook", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notebooks = await app.goToNotebooks();
  const notebook = await notebooks.createNotebook(NOTEBOOK);
  const subNotebook = await notebook?.createSubnotebook({
    title: "Subnotebook 1"
  });
  const notes = await subNotebook?.openNotebook();

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
    description: "A new edited description"
  };
  await notebook?.editNotebook(item);

  const editedNotebook = await notebooks.findNotebook(item);
  expect(editedNotebook).toBeDefined();
});

test("delete a notebook", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notebooks = await app.goToNotebooks();
  const notebook = await notebooks.createNotebook(NOTEBOOK);

  await notebook?.moveToTrash();

  expect(await notebook?.isPresent()).toBe(false);
  expect(await app.toasts.waitForToast("Notebook moved to trash")).toBe(true);
  const trash = await app.goToTrash();
  expect(await trash.findItem(NOTEBOOK.title)).toBeDefined();
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
  expect(await app.toasts.waitForToast("Item restored")).toBe(true);
});

test("permanently delete a notebook", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notebooks = await app.goToNotebooks();
  const notebook = await notebooks.createNotebook(NOTEBOOK);
  await notebook?.moveToTrash();
  const trash = await app.goToTrash();
  const trashItem = await trash.findItem(NOTEBOOK.title);
  if (!trashItem) throw new Error("No trash item found.");

  await trashItem?.delete();

  await expect(trashItem.locator).toBeHidden();
});

test("create shortcut of a notebook", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notebooks = await app.goToNotebooks();
  const notebook = await notebooks.createNotebook(NOTEBOOK);

  await notebook?.createShortcut();

  expect(await notebook?.isShortcut()).toBe(true);
  await app.goToHome();
  expect(await app.navigation.findItem(NOTEBOOK.title)).toBeDefined();
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

test("delete all notes within a notebook", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notebooks = await app.goToNotebooks();
  const notebook = await notebooks.createNotebook(NOTEBOOK);
  let notes = await notebook?.openNotebook();
  for (let i = 0; i < 2; ++i) {
    await notes?.createNote({
      title: `Note ${i}`,
      content: NOTE.content
    });
  }

  await notebook?.moveToTrash(true);

  notes = await app.goToNotes();
  expect(await notes.isEmpty()).toBe(true);
});

// test("delete all notes within a topic", async ({ page }) => {
//   const app = new AppModel(page);
//   await app.goto();
//   const notebooks = await app.goToNotebooks();
//   const notebook = await notebooks.createNotebook(NOTEBOOK);
//   const { topics } = (await notebook?.openNotebook()) || {};
//   const topic = await topics?.findItem({ title: NOTEBOOK.topics[0] });
//   let notes = await topic?.open();
//   for (let i = 0; i < 2; ++i) {
//     await notes?.createNote({
//       title: `Note ${i}`,
//       content: NOTE.content
//     });
//   }
//   await app.goBack();
//   await app.goBack();

//   await notebook?.moveToTrash(true);

//   notes = await app.goToNotes();
//   expect(await notes.isEmpty()).toBe(true);
// });

test("creating more than 20 notebooks shouldn't be possible on basic plan", async ({
  page
}, info) => {
  info.setTimeout(2 * 60 * 1000);

  await page.exposeBinding("isBasic", () => true);
  const app = new AppModel(page);
  await app.goto();
  const notebooks = await app.goToNotebooks();
  for (let i = 0; i < 20; ++i) {
    await notebooks.createNotebook({ title: `Notebook ${i}` });
  }

  const result = await Promise.race([
    notebooks.createNotebook(NOTEBOOK),
    app.toasts.waitForToast("Upgrade to Notesnook Pro to add more notebooks.")
  ]);
  expect(result).toBe(true);
});

test(`sort notebooks`, async ({ page }, info) => {
  info.setTimeout(2 * 60 * 1000);

  const app = new AppModel(page);
  await app.goto();
  const notebooks = await app.goToNotebooks();
  const titles = ["G ", "C ", "Gz", "2 ", "A "];
  for (const title of titles) {
    NOTEBOOK.title = title + NOTEBOOK.title;
    await notebooks.createNotebook(NOTEBOOK);
  }

  for (const sortBy of sortByOptions) {
    for (const orderBy of orderByOptions) {
      await test.step(`sort by ${sortBy}, order by ${orderBy}`, async () => {
        const sortResult = await notebooks?.sort({
          orderBy,
          sortBy
        });
        if (!sortResult) return;

        await expect(notebooks.items).toHaveCount(titles.length);
      });
    }
  }
});

test("when default notebook is set, created note in notes context should go to default notebook", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  let notebooks = await app.goToNotebooks();
  let notebook = await notebooks.createNotebook(NOTEBOOK);
  await notebook?.setAsDefault();

  const notes = await app.goToNotes();
  await notes?.createNote(NOTE);
  notebooks = await app.goToNotebooks();
  notebook = await notebooks.findNotebook(NOTEBOOK);
  const openedNotebook = await notebook?.openNotebook();

  expect(await openedNotebook?.notes.findNote(NOTE)).toBeDefined();
});

test("when default notebook is set, created note in other notebook's context should not go to default notebook", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  let notebooks = await app.goToNotebooks();
  let notebook = await notebooks.createNotebook(NOTEBOOK);
  await notebook?.setAsDefault();

  const otherNotebook = await notebooks.createNotebook({
    title: "Other Notebook"
  });
  const openedOtherNotebook = await otherNotebook?.openNotebook();
  await openedOtherNotebook?.notes.createNote(NOTE);
  notebooks = await app.goToNotebooks();
  notebook = await notebooks.findNotebook(NOTEBOOK);
  const openedNotebook = await notebook?.openNotebook();

  expect(await openedNotebook?.notes.findNote(NOTE)).toBeUndefined();
});

test("when default notebook is set, created note in tags context should go to default notebook", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  let notebooks = await app.goToNotebooks();
  let notebook = await notebooks.createNotebook(NOTEBOOK);
  await notebook?.setAsDefault();

  const tags = await app.goToTags();
  const tag = await tags.createItem({ title: "TestTag" });
  const openedTag = await tag?.open();
  await openedTag?.createNote(NOTE);
  notebooks = await app.goToNotebooks();
  notebook = await notebooks.findNotebook(NOTEBOOK);
  const openedNotebook = await notebook?.openNotebook();

  expect(await openedNotebook?.notes.findNote(NOTE)).toBeDefined();
});

test("when default notebook is set, created note in colors context should go to default notebook", async ({
  page
}) => {
  const coloredNote = { title: "Red note", content: NOTE.content };
  const app = new AppModel(page);
  await app.goto();
  let notebooks = await app.goToNotebooks();
  let notebook = await notebooks.createNotebook(NOTEBOOK);
  await notebook?.setAsDefault();

  const notes = await app.goToNotes();
  const note = await notes.createNote(NOTE);
  await note?.contextMenu.newColor({ color: "#ff0000", title: "red" });
  const color = await app.goToColor("red");
  await color?.createNote(coloredNote);
  notebooks = await app.goToNotebooks();
  notebook = await notebooks.findNotebook(NOTEBOOK);
  const openedNotebook = await notebook?.openNotebook();

  expect(await openedNotebook?.notes.findNote(coloredNote)).toBeDefined();
});
