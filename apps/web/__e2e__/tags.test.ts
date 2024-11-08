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
import { Item } from "./models/types";
import { groupByOptions, NOTE, orderByOptions, sortByOptions } from "./utils";

const TAG: Item = { title: "hello-world" };
const EDITED_TAG: Item = { title: "hello-world-2" };

test("create a tag", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const tags = await app.goToTags();

  const tag = await tags.createItem(TAG);

  expect(tag).toBeDefined();
});

test("creating a tag with name of an existing tag should give an error", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const tags = await app.goToTags();
  await tags.createItem(TAG);

  await tags.createItem(TAG);

  expect(
    await app.toasts.waitForToast("Tag with this title already exists.")
  ).toBe(true);
});

test("create a note inside a tag", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const tags = await app.goToTags();
  const tag = await tags.createItem(TAG);
  const notes = await tag?.open();

  const note = await notes?.createNote(NOTE);

  expect(note).toBeDefined();
  await notes?.newNote();
  await note?.openNote();
  const assignedTags = await notes?.editor.getTags();
  expect(assignedTags?.includes("hello-world")).toBeTruthy();
});

test("edit a tag", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const tags = await app.goToTags();
  const tag = await tags.createItem(TAG);

  await tag?.editItem(EDITED_TAG);

  const editedTag = await tags.findItem(EDITED_TAG);
  expect(editedTag).toBeDefined();
});

test("delete a tag", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const tags = await app.goToTags();
  const tag = await tags.createItem(TAG);

  await tag?.delete();

  expect(await app.toasts.waitForToast("Tag deleted")).toBe(true);
  expect(await tags?.findItem(TAG)).toBeUndefined();
});

test("create shortcut of a tag", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const tags = await app.goToTags();
  const tag = await tags.createItem(TAG);

  await tag?.createShortcut();

  expect(await tag?.isShortcut()).toBe(true);
  const allShortcuts = await app.navigation.getShortcuts();
  expect(allShortcuts.includes("hello-world")).toBeTruthy();
});

test("remove shortcut of a tag", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const tags = await app.goToTags();
  const tag = await tags.createItem(TAG);
  await tag?.createShortcut();

  await tag?.removeShortcut();

  expect(await tag?.isShortcut()).toBe(false);
  const allShortcuts = await app.navigation.getShortcuts();
  expect(allShortcuts.includes("hello-world")).toBeFalsy();
});

test("edit a tag and make sure all its references on note are updated", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  let tags = await app.goToTags();
  let tag = await tags.createItem(TAG);
  let notes = await tag?.open();
  await notes?.createNote(NOTE);
  tags = await app.goToTags();
  tag = await tags.findItem(TAG);

  await tag?.editItem(EDITED_TAG);

  notes = await tag?.open();
  await notes?.newNote();
  const note = await notes?.findNote(NOTE);
  expect((await note?.getTags())?.includes(EDITED_TAG.title)).toBeTruthy();
  await note?.openNote();
  expect(
    (await notes?.editor.getTags())?.includes(EDITED_TAG.title)
  ).toBeTruthy();
});

test("assigning tag to a note should create a tag", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  await notes.createNote(NOTE);

  await notes.editor.setTags([TAG.title]);

  const tags = await app.goToTags();
  expect(await tags.findItem(TAG)).toBeDefined();
});

test("delete a tag and make sure all associated notes are untagged", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  let notes = await app.goToNotes();
  await notes.createNote(NOTE);
  await notes.editor.setTags([TAG.title]);
  const tags = await app.goToTags();
  const tag = await tags.findItem(TAG);

  await tag?.delete();

  notes = await app.goToNotes();
  const note = await notes.findNote(NOTE);
  expect((await note?.getTags())?.includes(TAG.title)).toBeFalsy();
  await note?.openNote();
  expect((await notes?.editor.getTags())?.includes(TAG.title)).toBeFalsy();
});

test("delete the last note of a tag that is also a shortcut", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  let notes = await app.goToNotes();
  await notes.createNote(NOTE);
  await notes.editor.setTags([TAG.title]);
  const tags = await app.goToTags();
  const tag = await tags.findItem(TAG);
  await tag?.createShortcut();
  notes = await app.goToNotes();
  const note = await notes.findNote(NOTE);

  await note?.contextMenu.moveToTrash();

  expect(await app.getRouteHeader()).toBe("Notes");
});

test(`sort tags`, async ({ page }, info) => {
  info.setTimeout(2 * 60 * 1000);

  const app = new AppModel(page);
  await app.goto();
  const tags = await app.goToTags();
  const titles = ["G", "C", "Gz", "2", "A"];
  for (const title of titles) {
    const tag = await tags.createItem({ title: `${title}` });
    if (!tag) continue;
  }

  for (const groupBy of groupByOptions) {
    for (const sortBy of sortByOptions) {
      for (const orderBy of orderByOptions) {
        await test.step(`group by ${groupBy}, sort by ${sortBy}, order by ${orderBy}`, async () => {
          const sortResult = await tags?.sort({
            groupBy,
            orderBy,
            sortBy
          });
          if (!sortResult) return;

          await expect(tags.items).toHaveCount(titles.length);
        });
      }
    }
  }
});

test("creating more than 5 tags shouldn't be possible on basic plan", async ({
  page
}) => {
  await page.exposeBinding("isBasic", () => true);
  const app = new AppModel(page);
  await app.goto();
  const tags = await app.goToTags();
  for (const tag of ["tag1", "tag2", "tag3", "tag4", "tag5"]) {
    await tags.createItem({ title: tag });
  }

  const result = await Promise.race([
    tags.createItem({ title: "tag6" }),
    app.toasts.waitForToast("Upgrade to Notesnook Pro to create more tags.")
  ]);
  expect(result).toBe(true);
});
