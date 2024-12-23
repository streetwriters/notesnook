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
import {
  getTestId,
  groupByOptions,
  NOTE,
  orderByOptions,
  PASSWORD,
  sortByOptions
} from "./utils";

test("create a note", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();

  const note = await notes.createNote(NOTE);

  expect(note).toBeDefined();
});

test("delete a note", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note = await notes.createNote(NOTE);

  await note?.contextMenu.moveToTrash();

  expect(await app.toasts.waitForToast("Note moved to trash")).toBe(true);
  expect(await note?.isPresent()).toBe(false);
});

test("restore a note", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note = await notes.createNote(NOTE);
  await note?.contextMenu.moveToTrash();
  const trash = await app.goToTrash();

  const trashItem = await trash.findItem(NOTE.title);
  await trashItem?.restore();

  expect(await app.toasts.waitForToast("Item restored")).toBe(true);
  await app.goToNotes();
  await notes.waitForItem(NOTE.title);
  const restoredNote = await notes.findNote(NOTE);
  expect(restoredNote).toBeDefined();
});

test("permanently delete a note", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note = await notes.createNote(NOTE);
  await note?.contextMenu.moveToTrash();
  const trash = await app.goToTrash();

  const trashItem = await trash.findItem(NOTE.title);
  await trashItem?.delete();

  expect(await app.toasts.waitForToast("Item permanently deleted")).toBe(true);
  expect(await trash.findItem(NOTE.title)).toBeUndefined();
});

test("add a note to notebook", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note = await notes.createNote(NOTE);

  await note?.contextMenu.addToNotebook({
    title: "Notebook 1",
    subNotebooks: [
      { title: "Hello" },
      { title: "World", subNotebooks: [{ title: "Did" }, { title: "what" }] }
    ]
  });

  expect(await app.toasts.waitForToast("1 note added to 5 notebooks.")).toBe(
    true
  );
});

const actors = ["contextMenu", "properties"] as const;

for (const actor of actors) {
  test(`favorite a note using ${actor}`, async ({ page }) => {
    const app = new AppModel(page);
    await app.goto();
    const notes = await app.goToNotes();
    const note = await notes.createNote(NOTE);

    await note?.[actor].favorite();

    const favorites = await app.goToFavorites();
    const favoritedNote = await favorites.findNote(NOTE);
    expect(await favoritedNote?.contextMenu.isFavorited()).toBe(true);
    expect(await favoritedNote?.properties.isFavorited()).toBe(true);
  });

  test(`unfavorite a note using ${actor}`, async ({ page }) => {
    const app = new AppModel(page);
    await app.goto();
    const notes = await app.goToNotes();
    const note = await notes.createNote(NOTE);
    await note?.contextMenu.favorite();

    await note?.[actor].unfavorite();

    expect(await note?.contextMenu.isFavorited()).toBe(false);
    expect(await note?.properties.isFavorited()).toBe(false);
  });

  test(`pin a note using ${actor}`, async ({ page }) => {
    const app = new AppModel(page);
    await app.goto();
    const notes = await app.goToNotes();
    const note = await notes.createNote(NOTE);

    await note?.[actor].pin();

    expect(await note?.contextMenu.isPinned()).toBe(true);
    expect(await note?.properties.isPinned()).toBe(true);
    expect(await notes.findGroup("Pinned")).toBeDefined();
  });

  test(`unpin a note using ${actor}`, async ({ page }) => {
    const app = new AppModel(page);
    await app.goto();
    const notes = await app.goToNotes();
    const note = await notes.createNote(NOTE);
    await note?.contextMenu.pin();

    await note?.[actor].unpin();

    expect(await note?.contextMenu.isPinned()).toBe(false);
    expect(await note?.properties.isPinned()).toBe(false);
    expect(await notes.findGroup("Pinned")).toBeUndefined();
  });

  test(`assign a color to a note using ${actor}`, async ({ page }) => {
    const app = new AppModel(page);
    await app.goto();
    const notes = await app.goToNotes();
    const note = await notes.createNote(NOTE);
    await note?.contextMenu.newColor({ title: "red", color: "#ff0000" });
    await note?.contextMenu.uncolor("red");

    await note?.[actor].color("red");

    const coloredNotes = await app.goToColor("red");
    const coloredNote = await coloredNotes.findNote(NOTE);
    expect(coloredNote).toBeDefined();
    expect(await coloredNote?.contextMenu.isColored("red")).toBe(true);
    expect(await coloredNote?.properties.isColored("red")).toBe(true);
  });

  test(`lock a note using ${actor}`, async ({ page }) => {
    const app = new AppModel(page);
    await app.goto();
    const notes = await app.goToNotes();
    const note = await notes.createNote(NOTE);

    await note?.[actor].lock(PASSWORD);

    expect(await note?.contextMenu.isLocked()).toBe(true);
  });

  test(`unlock a note permanently using ${actor}`, async ({ page }) => {
    const app = new AppModel(page);
    await app.goto();
    const notes = await app.goToNotes();
    const note = await notes.createNote(NOTE);
    await note?.contextMenu.lock(PASSWORD);
    await note?.openLockedNote(PASSWORD);

    await note?.[actor].unlock(PASSWORD);

    await note?.descriptionText.waitFor();
    expect(await note?.getDescription()).toContain(NOTE.content);
    expect(await note?.contextMenu.isLocked()).toBe(false);
  });
}

test("open a locked note", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note = await notes.createNote(NOTE);
  await note?.contextMenu.lock(PASSWORD);

  await note?.openLockedNote(PASSWORD);

  await notes.editor.waitForLoading();
  expect(await notes.editor.getContent("text")).toBe(NOTE.content);
  expect(await note?.contextMenu.isLocked()).toBe(true);
});

test("add tags to note", async ({ page }) => {
  const tags = ["hello", "nevermind", "what", "no-way", "gold-and-goldie"];
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  await notes.createNote(NOTE);

  await notes.editor.setTags(tags);
  await page.waitForTimeout(200);

  const noteTags = await notes.editor.getTags();
  expect(noteTags).toHaveLength(tags.length);
  expect(noteTags.every((t, i) => t === tags[i])).toBe(true);
});

test("add tags to locked note", async ({ page }) => {
  const tags = ["incognito", "secret-stuff"];
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note = await notes.createNote(NOTE);
  await note?.contextMenu.lock(PASSWORD);
  await note?.openLockedNote(PASSWORD);

  await notes.editor.setTags(tags);
  await page.waitForTimeout(200);

  const noteTags = await notes.editor.getTags();
  expect(noteTags).toHaveLength(tags.length);
  expect(noteTags.every((t, i) => t === tags[i])).toBe(true);
});

for (const format of ["html", "txt", "md"] as const) {
  test(`export note as ${format}`, async ({ page }) => {
    const app = new AppModel(page);
    await app.goto();
    const notes = await app.goToNotes();
    const note = await notes.createNote(NOTE);

    const output = await note?.contextMenu.export(format);

    expect(output).toMatchSnapshot(`export-${format}.txt`);
  });
}

test("unlock a note for editing", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note = await notes.createNote(NOTE);
  await note?.contextMenu.lock(PASSWORD);
  await note?.openLockedNote(PASSWORD);

  const content = "Edits 1 2 3";
  await notes.editor.setContent(content);
  await page.waitForTimeout(150);

  await page.reload();
  await notes.waitForList();

  const newContent = `${NOTE.content}${content}`;
  const editedNote = await notes.findNote({
    title: NOTE.title,
    content: newContent
  });
  if (!editedNote) throw new Error("Could not find note.");
  await editedNote.openLockedNote(PASSWORD);
  await notes.editor.waitForLoading();
  expect(await notes.editor.getContent("text")).toContain(newContent);
});

test("change title of a locked note", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note = await notes.createNote(NOTE);
  await note?.contextMenu.lock(PASSWORD);
  await note?.openLockedNote(PASSWORD);

  const title = "NEW TITLE!";
  await notes.editor.setTitle(title);
  await page.waitForTimeout(150);

  await page.reload();
  await notes.waitForList();
  const editedNote = await notes.findNote({ title });
  await editedNote?.openLockedNote(PASSWORD);
  expect(await note?.getTitle()).toContain(title);
  expect(await notes.editor.getTitle()).toContain(title);
});

test(`sort notes`, async ({ page }, info) => {
  info.setTimeout(2 * 60 * 1000);

  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const titles = ["G ", "C ", "Gz", "2 ", "A "];
  for (const title of titles) {
    await notes.createNote({
      title: `${title} is Title`,
      content: "This is test".repeat(10)
    });
  }

  for (const groupBy of groupByOptions) {
    for (const sortBy of sortByOptions) {
      for (const orderBy of orderByOptions) {
        await test.step(`group by ${groupBy}, sort by ${sortBy}, order by ${orderBy}`, async () => {
          const sortResult = await notes?.sort({
            groupBy,
            orderBy,
            sortBy
          });
          if (!sortResult) return;

          await expect(notes.items).toHaveCount(titles.length);
        });
      }
    }
  }
});
