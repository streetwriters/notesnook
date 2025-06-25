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
import { createHistorySession, NOTE } from "./utils";

test("notes should open in the same tab", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  await notes.createNote({ title: "Note 1" });
  await notes.createNote({ title: "Note 2" });
  await notes.createNote({ title: "Note 3" });
  await page.reload();

  const note = await notes.findNote({ title: "Note 2" });
  await note?.click();

  const tabs = await notes.editor.getTabs();
  expect(tabs.length).toBe(1);
});

test("new note should open in the same tab", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  await notes.createNote({ title: "Note 1" });

  await notes.newNote();

  const tabs = await notes.editor.getTabs();
  expect(tabs.length).toBe(1);
});

test("open note in new tab (using context menu)", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  await notes.createNote({ title: "Note 1" });
  await notes.createNote({ title: "Note 2" });
  await notes.createNote({ title: "Note 3" });

  const note = await notes.findNote({ title: "Note 2" });
  await note?.contextMenu.openInNewTab();
  await notes.editor.waitForLoading();

  const tabs = await notes.editor.getTabs();
  expect(tabs.length).toBe(2);
  await expect(tabs[1].titleElement).toHaveText("Note 2");
});

test("open note in new tab (using middle click)", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  await notes.createNote({ title: "Note 1" });
  await notes.createNote({ title: "Note 2" });
  await notes.createNote({ title: "Note 3" });

  const note = await notes.findNote({ title: "Note 2" });
  await note?.click({ middleClick: true });
  await notes.editor.waitForLoading();

  const tabs = await notes.editor.getTabs();
  expect(tabs.length).toBe(2);
  await expect(tabs[1].titleElement).toHaveText("Note 2");
});

test("go back should open previous note", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const tabs = await notes.editor.getTabs();
  await notes.createNote({ title: "Note 1" });
  await notes.createNote({ title: "Note 2" });
  await notes.createNote({ title: "Note 3" });

  await notes.editor.goBack();
  await expect(tabs[0].titleElement).toHaveText("Note 2");
  await notes.editor.goBack();
  await expect(tabs[0].titleElement).toHaveText("Note 1");
});

test("go forward should open next note", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const tabs = await notes.editor.getTabs();
  await notes.createNote({ title: "Note 1" });
  await notes.createNote({ title: "Note 2" });
  await notes.createNote({ title: "Note 3" });

  await notes.editor.goBack();
  await notes.editor.goBack();
  await notes.editor.goForward();
  await expect(tabs[0].titleElement).toHaveText("Note 2");
  await notes.editor.goForward();
  await expect(tabs[0].titleElement).toHaveText("Note 3");
});

test("new tab button should open a new tab", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  await notes.createNote({ title: "Note 1" });

  await notes.editor.newTab();

  const tabs = await notes.editor.getTabs();
  await expect(tabs[0].titleElement).toHaveText("Note 1");
  await expect(tabs[1].titleElement).toHaveText("Untitled");
});

test("content changes in a note opened in multiple tabs should sync", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note = await notes.createNote({ title: "Note 1" });
  await note?.contextMenu.openInNewTab();

  await notes.editor.editAndWait(async () => {
    await notes.editor.setContent("This change should sync.");
  });

  const tabs = await notes.editor.getTabs();
  await tabs[0].click();
  expect(await notes.editor.getContent("text")).toBe(
    "This change should sync."
  );
});

test("open same note in 2 tabs and refresh page", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note = await notes.createNote({
    title: "Note 1",
    content: "Some edits."
  });
  await note?.contextMenu.openInNewTab();
  await notes.editor.waitForLoading();

  await page.reload();
  await notes.waitForList();

  const tabs = await notes.editor.getTabs();
  await tabs[0].click();
  await notes.editor.waitForLoading();
  expect(await notes.editor.getContent("text")).toBe("Some edits.");
});

test("reloading with a note diff open in a tab", async ({ page }) => {
  const { note, contents } = await createHistorySession(page);
  const history = await note?.properties.getSessionHistory();
  const preview = await history?.[0].open();
  await preview!.firstEditor.waitFor({ state: "visible" });
  await page.waitForTimeout(1000);

  await page.reload();
  await preview!.firstEditor.waitFor({ state: "visible" });

  await expect(preview!.firstEditor.locator(".ProseMirror")).toHaveText(
    contents[0]
  );
  await expect(preview!.secondEditor.locator(".ProseMirror")).toHaveText(
    contents[0]
  );
});

test("navigate back and forth between normal and diff session", async ({
  page
}) => {
  const { note, contents, notes } = await createHistorySession(page);
  const history = await note?.properties.getSessionHistory();
  const preview = await history?.[0].open();
  await preview!.firstEditor.waitFor({ state: "visible" });

  await notes.editor.goBack();
  await preview!.firstEditor.waitFor({ state: "hidden" });

  expect(await notes.editor.getContent("text")).toBe(contents[0]);

  await notes.editor.goForward();
  await preview!.firstEditor.waitFor({ state: "visible" });

  await expect(preview!.firstEditor.locator(".ProseMirror")).toHaveText(
    contents[0]
  );
  await expect(preview!.secondEditor.locator(".ProseMirror")).toHaveText(
    contents[0]
  );
});

test("clicking on a note that's already opened in another tab should focus the tab", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note = await notes.createNote({
    title: "Note 1"
  });
  await note?.contextMenu.openInNewTab();
  await notes.editor.waitForLoading();
  await notes.createNote({
    title: "Note 2"
  });

  await note?.openNote();

  const tabs = await notes.editor.getTabs();
  await expect(tabs[0].locator).toHaveClass(/active/);
});

test("open a note in 2 tabs then open another note and navigate back", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note = await notes.createNote({
    title: "Note 1"
  });
  await note?.contextMenu.openInNewTab();
  await notes.editor.waitForLoading();
  await notes.createNote({
    title: "Note 2"
  });

  await notes.editor.goBack();

  const tabs = await notes.editor.getTabs();
  await expect(tabs[1].locator).toHaveClass(/active/);
  await expect(tabs[1].titleElement).toHaveText("Note 1");
});

test("shouldn't be possible to open a note in a pinned tab", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note = await notes.createNote({
    title: "Note 1"
  });
  await notes.createNote({
    title: "Note 2"
  });
  let tabs = await notes.editor.getTabs();
  await tabs[0].contextMenu.pin();

  await note?.click();
  await notes.editor.waitForLoading();

  tabs = await notes.editor.getTabs();
  expect(tabs.length).toBe(2);
  await expect(tabs[1].locator).toHaveClass(/active/);
  await expect(tabs[1].titleElement).toHaveText("Note 1");
});

test("shouldn't be possible to create a new note in a pinned tab", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  await notes.createNote({
    title: "Note 1"
  });
  let tabs = await notes.editor.getTabs();
  await tabs[0].contextMenu.pin();

  await notes.newNote();

  tabs = await notes.editor.getTabs();
  expect(tabs.length).toBe(2);
  await expect(tabs[1].locator).toHaveClass(/active/);
});

test("notes open in multiple tabs should sync tags when tags are added", async ({
  page
}) => {
  const tags = ["toAdd", "todo"];
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note = await notes.createNote(NOTE);
  await note?.contextMenu.openInNewTab();

  await notes.editor.setTags(tags);
  const tabs = await notes.editor.getTabs();
  await tabs[0].click();

  const noteTags = await notes.editor.getTags();
  expect(noteTags).toHaveLength(tags.length);
  expect(noteTags.every((t, i) => t === tags[i])).toBe(true);
});

test("notes open in multiple tabs should sync tags when tags are removed", async ({
  page
}) => {
  const tags = ["removeme", "dontremoveme", "removemex2", "todo"];
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note = await notes.createNote(NOTE);
  await notes.editor.setTags(tags);
  await note?.contextMenu.openInNewTab();

  await notes.editor.removeTags(["removeme", "removemex2"]);
  const tabs = await notes.editor.getTabs();
  await tabs[0].click();

  const noteTags = await notes.editor.getTags();
  expect(noteTags).toHaveLength(2);
  expect(noteTags.every((t, i) => t === ["dontremoveme", "todo"][i])).toBe(
    true
  );
});

test("notes open in multiple tabs should sync color in note properties when color is changed", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note = await notes.createNote(NOTE);
  await note?.contextMenu.newColor({ title: "red", color: "#ff0000" });
  await note?.contextMenu.newColor({ title: "blue", color: "#0000ff" });
  await note?.contextMenu.openInNewTab();

  await notes.editor.waitForLoading();
  const tabs = await notes.editor.getTabs();
  await tabs[0].click();

  expect(await note?.properties.isColored("blue")).toBe(true);

  await note?.properties.color("red");
  await tabs[1].click();

  expect(await note?.properties.isColored("red")).toBe(true);
});

test("notes open in multiple tabs should sync title when title is changed", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note = await notes.createNote(NOTE);
  await notes.editor.setTitle("Todo");
  await note?.contextMenu.openInNewTab();

  expect(await notes.editor.getTitle()).toBe("Todo");

  await notes.editor.setTitle("Todo - Today");
  const tabs = await notes.editor.getTabs();
  await tabs[0].click();

  expect(await notes.editor.getTitle()).toBe("Todo - Today");
});

test("when active tab is pinned, opening other notes should open existing note tab if present", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note1 = await notes.createNote({
    title: "Note 1"
  });
  const note2 = await notes.createNote({
    title: "Note 2"
  });
  let tabs = await notes.editor.getTabs();
  await tabs[0].contextMenu.pin();

  await note1?.click();
  await notes.editor.waitForLoading();
  await note2?.click();
  await notes.editor.waitForLoading();
  await note1?.click();
  await notes.editor.waitForLoading();

  tabs = await notes.editor.getTabs();
  expect(tabs.length).toBe(2);
  await expect(tabs[1].locator).toHaveClass(/active/);
  await expect(tabs[1].titleElement).toHaveText("Note 1");
  await expect(tabs[0].titleElement).toHaveText("Note 2");
});

test("activating pinned tab after page reload should not open a duplicate tab", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  await notes.createNote({
    title: "Note 1"
  });
  let tabs = await notes.editor.getTabs();
  await tabs[0].contextMenu.pin();

  await page.reload();
  await notes.waitForList();

  tabs = await notes.editor.getTabs();
  expect(tabs.length).toBe(1);
  await expect(tabs[0].locator).toHaveClass(/active/);
});

test("if note is active in a tab, moving the note to trash should close the tab", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note = await notes.createNote({
    title: "Note 1"
  });

  await note?.contextMenu.moveToTrash();

  const tabs = await notes.editor.getTabs();
  expect(tabs.length).toBe(1);
  await expect(tabs[0].titleElement).toHaveText("Untitled");
});

test("if note is active in multiple tabs, moving the note to trash should close those tabs", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note = await notes.createNote({
    title: "Note 1"
  });
  await note?.contextMenu.openInNewTab();

  await note?.contextMenu.moveToTrash();

  const tabs = await notes.editor.getTabs();
  expect(tabs.length).toBe(1);
  await expect(tabs[0].titleElement).toHaveText("Untitled");
});

test("if note is present in tab history, moving the note to trash shouldn't close the tab", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note = await notes.createNote({
    title: "Note 1"
  });
  await notes.createNote({ title: "Note 2" });

  await note?.contextMenu.moveToTrash();

  const tabs = await notes.editor.getTabs();
  expect(tabs.length).toBe(1);
  await expect(tabs[0].titleElement).toHaveText("Note 2");
});

test("if note is active in a tab and present in other tab's history, moving the note to trash should only close the tab where note is active", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note = await notes.createNote({
    title: "Note 1"
  });
  await note?.contextMenu.openInNewTab();
  await notes.editor.waitForLoading();
  await notes.createNote({ title: "Note 2" });

  await note?.contextMenu.moveToTrash();

  const tabs = await notes.editor.getTabs();
  expect(tabs.length).toBe(1);
  await expect(tabs[0].locator).toHaveText("Note 2");
});

test.skip("TODO: open a locked note, switch to another note and navigate back", () => {});
test.skip("TODO: open a locked note, switch to another note, unlock the note and navigate back", () => {});
