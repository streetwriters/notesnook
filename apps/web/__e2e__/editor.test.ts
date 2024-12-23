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
import { getTestId, NOTE, TITLE_ONLY_NOTE } from "./utils";

test("focus mode", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  await notes.createNote(NOTE);

  await notes.editor.enterFocusMode();

  expect(await notes.editor.isFocusMode()).toBeTruthy();
  expect(
    await page.screenshot({ fullPage: true, quality: 100, type: "jpeg" })
  ).toMatchSnapshot("focus-mode.jpg", { maxDiffPixelRatio: 0.01 });
});

test("full screen in focus mode", async ({ page, headless }) => {
  // fullscreen doesn't work in headless mode
  if (headless) return;

  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  await notes.createNote(NOTE);
  await notes.editor.enterFocusMode();

  await notes.editor.enterFullscreen();
  expect(await notes.editor.isFullscreen()).toBeTruthy();

  await notes.editor.exitFullscreen();
  expect(await notes.editor.isFullscreen()).toBeFalsy();
});

test("normal mode from focus mode", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  await notes.createNote(NOTE);
  await notes.editor.enterFocusMode();

  await notes.editor.exitFocusMode();

  expect(await notes.editor.isFocusMode()).toBeFalsy();
  expect(
    await page.screenshot({ fullPage: true, quality: 100, type: "jpeg" })
  ).toMatchSnapshot("normal-mode-from-focus-mode.jpg", {
    maxDiffPixelRatio: 0.01
  });
});

test("creating a new note should clear the editor contents & title", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  await notes.createNote(NOTE);

  await notes.newNote();

  expect(await notes.editor.isUnloaded()).toBeTruthy();
  expect(await notes.editor.getTitle()).toBe("");
  expect(await notes.editor.getContent("text")).toBe("");
});

test("creating a new title-only note should add it to the list", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();

  const note = await notes.createNote({ title: NOTE.title });

  expect(note).toBeDefined();
});

test("opening an empty titled note should empty out editor contents", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  let notes = await app.goToNotes();
  await notes.createNote(NOTE);
  await notes.createNote(TITLE_ONLY_NOTE);
  await notes.newNote();
  await app.goto();
  notes = await app.goToNotes();
  const fullNote = await notes.findNote(NOTE);
  await fullNote?.openNote();

  const onlyTitle = await notes.findNote(TITLE_ONLY_NOTE);
  await onlyTitle?.openNote();

  expect(await notes.editor.getContent("text")).toBe("");
  expect(await notes.editor.getTitle()).toBe(TITLE_ONLY_NOTE.title);
});

test("focus should not jump to editor while typing in title input", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  await notes.newNote();

  await notes.editor.typeTitle("Hello", 200);

  expect(await notes.editor.getTitle()).toBe("Hello");
  expect(await notes.editor.getContent("text")).toBe("");
});

test("select all & backspace should clear all content in editor", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note = await notes.createNote(NOTE);

  await notes.editor.clear();

  await notes.newNote();
  await note?.openNote();
  expect(await notes.editor.getContent("text")).toBe("");
});

test("editing a note and switching immediately to another note and making an edit shouldn't overlap both notes", async ({
  page
}, test) => {
  test.setTimeout(45 * 1000);

  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note1 = await notes.createNote({
    title: "Test note 1",
    content: "53ad8e4e40ebebd0f400498d"
  });
  const note2 = await notes.createNote({
    title: "Test note 2",
    content: "f054d19e9a2f46eff7b9bb25"
  });

  for (let i = 0; i < 10; ++i) {
    await note1?.openNote();
    await notes.editor.setContent(`Test note 1 (${i}) `);

    await note2?.openNote();
    await notes.editor.setContent(`Test note 2 (${i})`);
  }

  await notes.editor.waitForSaving();
  await notes.newNote();

  await note2?.openNote();
  expect(await notes.editor.getContent("text")).toMatchSnapshot(
    `fast-switch-and-edit-note-2.txt`
  );

  await note1?.openNote();
  expect(await notes.editor.getContent("text")).toMatchSnapshot(
    `fast-switch-and-edit-note-1.txt`
  );
});

test("editing a note and switching immediately to another note and editing the title shouldn't overlap both notes", async ({
  page
}, test) => {
  test.setTimeout(45 * 1000);

  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note1 = await notes.createNote({
    title: "Test note 1",
    content: "53ad8e4e40ebebd0f400498d"
  });
  const note2 = await notes.createNote({
    title: "Test note 2",
    content: "f054d19e9a2f46eff7b9bb25"
  });

  for (let i = 0; i < 10; ++i) {
    await note1?.openNote();
    await notes.editor.typeTitle(`Test note 1 (${i}) `);

    await note2?.openNote();
    await notes.editor.typeTitle(`Test note 2 (${i})`);
  }

  await notes.editor.waitForSaving();
  await notes.newNote();

  await note2?.openNote();
  expect(await notes.editor.getTitle()).toMatchSnapshot(
    `fast-switch-and-edit-note-title-2.txt`
  );

  await note1?.openNote();
  expect(await notes.editor.getTitle()).toMatchSnapshot(
    `fast-switch-and-edit-note-title-1.txt`
  );
});

test("editing a note and toggling read-only mode should show updated content", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note = await notes.createNote(NOTE);
  await notes.newNote();
  await note?.openNote();

  await notes.editor.setContent(`An edit I made`);
  await note?.properties.readonly();

  expect(await note?.properties.isReadonly()).toBeTruthy();
  expect(await notes.editor.getContent("text")).toMatchSnapshot(
    `readonly-edited-note.txt`
  );
});

test("creating a new note and toggling read-only mode should not empty editor content", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note = await notes.createNote(NOTE);

  await note?.properties.readonly();

  expect(await note?.properties.isReadonly()).toBeTruthy();
  expect(await notes.editor.getContent("text")).not.toHaveLength(0);
  expect(await notes.editor.getContent("text")).toBe(NOTE.content);
});

test("#1468 count words separated by newlines", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();

  await notes.createNote({
    content: "1\n2\n3\na\nb\nc\nd\ne\nali\nwaqar",
    title: NOTE.title
  });

  expect((await notes.editor.getWordCount()) === 10).toBeTruthy();
});

test("disable autosave when note crosses MAX_AUTO_SAVEABLE_WORDS", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const content = "a ".repeat(100);

  await notes.createNote({
    title: "many words",
    content
  });

  expect(
    await app.toasts.waitForToast(
      "Auto-save is disabled for large notes. Press Ctrl + S to save."
    )
  ).toBe(true);
  await expect(notes.editor.notSavedIcon).toBeVisible();
});

test("when autosave is disabled, pressing ctrl+s should save the note", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const content = "a ".repeat(100);
  await notes.createNote({
    title: NOTE.title,
    content
  });

  await page.keyboard.press("Control+s");

  await expect(notes.editor.savedIcon).toBeVisible();
});

test("when autosave is disabled, switching to another note should save the note", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const content = "a ".repeat(100);
  const note1 = await notes.createNote({
    title: "Test note 1"
  });
  const note2 = await notes.createNote({
    title: "Test note 2"
  });
  await note1?.openNote();
  await notes.editor.setContent(content);

  await note2?.openNote();

  await note1?.openNote();
  await expect(notes.editor.savedIcon).toBeVisible();
  expect(await notes.editor.getContent("text")).toBe(content.trim());
});

test("when autosave is disabled, creating a new note should save the note", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const content = "a ".repeat(100);
  const note = await notes.createNote({
    title: NOTE.title,
    content
  });

  await notes.newNote();

  await note?.openNote();
  await expect(notes.editor.savedIcon).toBeVisible();
  expect(await notes.editor.getContent("text")).toBe(content.trim());
});

test("when autosave is disabled, closing the note should save it", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const content = "a ".repeat(100);
  const note = await notes.createNote({
    title: "Title",
    content
  });

  const noteTab = await notes.editor.findTab((await note!.getId())!);
  await noteTab?.close();

  await note?.openNote();
  await expect(notes.editor.savedIcon).toBeVisible();
  expect(await notes.editor.getContent("text")).toBe(content.trim());
});
