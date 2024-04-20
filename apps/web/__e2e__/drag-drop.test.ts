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

import { expect, test } from "@playwright/test";
import { AppModel } from "./models/app.model";
import { NotesViewModel } from "./models/notes-view.model";
import { getTestId } from "./utils";

for (const item of [
  { id: "notebooks", title: "Notebooks" },
  { id: "tags", title: "Tags" }
]) {
  test(`drag & hover over ${item.id} should navigate inside`, async ({
    page
  }) => {
    const app = new AppModel(page);
    await app.goto();
    const notes = await app.goToNotes();
    const note = await notes.createNote({
      title: `Test note`
    });
    const navigationItem = await app.navigation.findItem(item.title);

    await note?.locator.hover();
    await page.mouse.down();
    await navigationItem?.locator.hover();
    await navigationItem?.locator.hover();
    await page.waitForTimeout(1000);

    await expect(app.routeHeader).toHaveText(item.title);
  });
}

test(`drag & drop note over Favorites should make the note favorite`, async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note = await notes.createNote({
    title: `Test note`
  });
  const navigationItem = await app.navigation.findItem("Favorites");

  await note?.locator.dragTo(navigationItem.locator);

  expect(await note?.isFavorite()).toBe(true);
});

test(`drag & drop note over Trash should move the note to Trash`, async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note = await notes.createNote({
    title: `Test note`
  });
  const navigationItem = await app.navigation.findItem("Trash");

  await note?.locator.dragTo(navigationItem.locator);

  const trash = await app.goToTrash();
  expect(await trash.findItem("Test note")).toBeDefined();
});

test(`drag & drop note over a notebook should get assigned to the notebook`, async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notebooks = await app.goToNotebooks();
  const notebook = await notebooks.createNotebook({ title: "Test notebook" });
  const notes = await app.goToNotes();
  const note = await notes.createNote({
    title: `Test note`
  });
  const navigationItem = await app.navigation.findItem("Notebooks");

  await note?.locator.hover();
  await page.mouse.down();
  await navigationItem?.locator.hover();
  await navigationItem?.locator.hover();
  await page.waitForTimeout(1000);
  await notebook?.locator.hover();
  await notebook?.locator.hover();
  await page.mouse.up();

  const { notes: notebookNotes } = (await notebook?.openNotebook()) || {};
  expect(await notebookNotes?.findNote({ title: "Test note" })).toBeDefined();
});

test(`drag & drop note over a tag should get assigned to the tag`, async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const tags = await app.goToTags();
  const tag = await tags.createItem({ title: "Tag" });
  const notes = await app.goToNotes();
  const note = await notes.createNote({
    title: `Test note`
  });
  const navigationItem = await app.navigation.findItem("Tags");

  await note?.locator.hover();
  await page.mouse.down();
  await navigationItem?.locator.hover();
  await navigationItem?.locator.hover();
  await page.waitForTimeout(1000);
  await tag?.locator.hover();
  await tag?.locator.hover();
  await page.mouse.up();

  const tagNotes = await tag?.open();
  expect(await tagNotes?.findNote({ title: "Test note" })).toBeDefined();
});

test(`drag & drop note over a tag shortcut should get assigned to the tag`, async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const tags = await app.goToTags();
  const tag = await tags.createItem({ title: "Tag1" });
  await tag?.createShortcut();
  const notes = await app.goToNotes();
  const note = await notes.createNote({
    title: `Test note`
  });
  const navigationItem = await app.navigation.findItem("Tag1");

  await note?.locator.hover();
  await page.mouse.down();
  await navigationItem?.locator.hover();
  await page.mouse.up();

  await navigationItem?.click();
  const tagNotes = new NotesViewModel(page, "notes", "notes");
  expect(await tagNotes?.findNote({ title: "Test note" })).toBeDefined();
});

test(`drag & drop note over a notebook shortcut should get assigned to the notebook`, async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notebooks = await app.goToNotebooks();
  const notebook = await notebooks.createNotebook({ title: "Test notebook" });
  await notebook?.createShortcut();
  const notes = await app.goToNotes();
  const note = await notes.createNote({
    title: `Test note`
  });
  const navigationItem = await app.navigation.findItem("Test notebook");

  await note?.locator.hover();
  await page.mouse.down();
  await navigationItem?.locator.hover();
  await page.mouse.up();

  await navigationItem?.click();
  const notebookNotes = new NotesViewModel(page, "notebook", "notes");
  expect(await notebookNotes?.findNote({ title: "Test note" })).toBeDefined();
});

test(`drag & drop note over a nested notebook should get assigned to the notebook`, async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notebooks = await app.goToNotebooks();
  const notebook = await notebooks.createNotebook({
    title: "Test notebook",
    subNotebooks: [{ title: "Nested notebook" }]
  });
  const nestedNotebook = await (
    await notebook?.openNotebook()
  )?.subNotebooks.createNotebook({ title: "Nested notebook" });
  const notes = await app.goToNotes();
  const note = await notes.createNote({
    title: `Test note`
  });
  const navigationItem = await app.navigation.findItem("Notebooks");

  await note?.locator.hover();
  await page.mouse.down();
  await navigationItem?.locator.hover();
  await navigationItem?.locator.hover();
  await page.waitForTimeout(1000);
  await nestedNotebook?.locator.hover();
  await nestedNotebook?.locator.hover();
  await page.mouse.up();

  await nestedNotebook?.click();
  const notebookNotes = new NotesViewModel(page, "notebook", "notes");
  expect(await notebookNotes?.findNote({ title: "Test note" })).toBeDefined();
});

test(`drag & hover over a nested notebook should navigate inside`, async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notebooks = await app.goToNotebooks();
  const notebook = await notebooks.createNotebook({
    title: "Test notebook",
    subNotebooks: [{ title: "Nested notebook" }]
  });
  const nestedNotebook = await (
    await notebook?.openNotebook()
  )?.subNotebooks.createNotebook({ title: "Nested notebook" });
  const notes = await app.goToNotes();
  const note = await notes.createNote({
    title: `Test note`
  });
  const navigationItem = await app.navigation.findItem("Notebooks");
  await navigationItem?.click();
  await navigationItem?.click();
  await app.goToNotes();

  await note?.locator.hover();
  await page.mouse.down();
  await navigationItem?.locator.hover();
  await navigationItem?.locator.hover();
  await page.waitForTimeout(1000);
  await notebook?.locator.hover();
  await notebook?.locator.hover();
  await page.waitForTimeout(1000);
  await nestedNotebook?.locator.hover();
  await nestedNotebook?.locator.hover();
  await page.waitForTimeout(1000);
  await page.keyboard.press("Escape");

  expect(
    await page
      .locator(getTestId("notebook-header"))
      .locator(getTestId("notebook-title"))
      .textContent()
  ).toBe("Nested notebook");
});
