/* This file is part of the Notesnook project (https://notesnook.com/)
 *
 * Copyright (C) 2022 Streetwriters (Private) Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

const { test, expect } = require("@playwright/test");
const {
  createNote,
  NOTE,
  getTestId,
  getEditorTitle,
  getEditorContent,
  getEditorContentAsHTML,
  editNote
} = require("./utils");
const {
  checkNotePresence,
  createNoteAndCheckPresence
} = require("./utils/conditions");
/**
 * @type {import("@playwright/test").Page}
 */
var page = null;
global.page = null;
test.beforeEach(async ({ page: _page, baseURL }) => {
  global.page = _page;
  page = _page;
  await page.goto(baseURL);
  await page.waitForSelector(getTestId("routeHeader"));
});

test("focus mode", async () => {
  await createNote(NOTE, "notes");

  await page.click(getTestId("focus-mode"));

  await page.waitForTimeout(500);

  expect(
    await page.screenshot({ fullPage: true, quality: 100, type: "jpeg" })
  ).toMatchSnapshot("focus-mode.jpg", { threshold: 99 });
});

test("dark mode in focus mode", async () => {
  await createNote(NOTE, "notes");

  await page.click(getTestId("focus-mode"));

  await page.waitForTimeout(500);

  await page.click(getTestId("dark-mode"));

  await page.waitForTimeout(1000);

  expect(
    await page.screenshot({ fullPage: true, quality: 100, type: "jpeg" })
  ).toMatchSnapshot("dark-focus-mode.jpg", { threshold: 99 });

  await page.click(getTestId("dark-mode"));

  await page.waitForTimeout(1000);

  expect(
    await page.screenshot({ fullPage: true, quality: 100, type: "jpeg" })
  ).toMatchSnapshot("light-focus-mode.jpg", { threshold: 99 });
});

test("full screen in focus mode", async () => {
  await createNote(NOTE, "notes");

  await page.click(getTestId("focus-mode"));

  await page.waitForTimeout(500);

  await page.click(getTestId("enter-fullscreen"));

  await page.waitForTimeout(100);

  await page.click(getTestId("exit-fullscreen"));
});

test("normal mode from focus mode", async () => {
  await createNote(NOTE, "notes");

  await page.click(getTestId("focus-mode"));

  await page.waitForTimeout(500);

  await page.click(getTestId("normal-mode"));

  await page.waitForTimeout(1000);

  expect(
    await page.screenshot({ fullPage: true, quality: 100, type: "jpeg" })
  ).toMatchSnapshot("normal-mode-from-focus-mode.jpg", { threshold: 99 });
});

test("creating a new note should clear the editor contents & title", async () => {
  await createNoteAndCheckPresence();

  await page.click(getTestId("notes-action-button"));

  expect(await getEditorTitle()).toBe("");

  expect(await getEditorContent()).toBe("");
});

test("creating a new note should clear the word count", async () => {
  const selector = await createNoteAndCheckPresence();

  await page.click(getTestId("notes-action-button"));

  await page.click(selector);

  await createNote({ title: "Hello World" }, "notes");

  await expect(page.innerText(getTestId("editor-word-count"))).resolves.toBe(
    "0 words"
  );
});

test("creating a new title-only note should add it to the list", async () => {
  const selector = await createNoteAndCheckPresence();

  await page.click(getTestId("notes-action-button"));

  await page.click(selector);

  await createNoteAndCheckPresence({ title: "Hello World" });
});

test.skip("format changes should get saved", async () => {
  const selector = await createNoteAndCheckPresence();

  await page.click(getTestId("notes-action-button"));

  await page.click(selector);

  await page.waitForSelector(".mce-content-body");

  await page.keyboard.press("Shift+End");

  await page.click(`#editorToolbar button[title="Bold"]`);

  await page.waitForTimeout(200);

  await page.click(getTestId("notes-action-button"));

  await page.click(selector);

  const content = await getEditorContentAsHTML();

  expect(content).toMatchSnapshot(`format-changes-should-get-saved.txt`);
});

test("opening an empty titled note should empty out editor contents", async () => {
  await createNoteAndCheckPresence();

  const onlyTitle = await createNoteAndCheckPresence({
    title: "Only a title"
  });

  await page.click(getTestId("notes-action-button"));

  await page.reload();

  const fullNote = await checkNotePresence("home", 1, NOTE);

  await page.click(fullNote);

  await expect(getEditorContent()).resolves.toBe(NOTE.content);

  await expect(getEditorTitle()).resolves.toBe(NOTE.title);

  await page.click(onlyTitle);

  await expect(getEditorTitle()).resolves.toBe("Only a title");

  await expect(getEditorContent()).resolves.toBe("");
});

test("focus should not jump to editor while typing in title input", async () => {
  await page.click(getTestId("notes-action-button"));

  await page.waitForSelector(".ProseMirror");

  await page.type(getTestId("editor-title"), "Hello", { delay: 200 });

  await expect(getEditorTitle()).resolves.toBe("Hello");

  await expect(getEditorContent()).resolves.toBe("");
});

test("select all & backspace should clear all content in editor", async () => {
  const selector = await createNoteAndCheckPresence();

  await page.focus(".ProseMirror");

  await page.keyboard.press("Home");

  await page.keyboard.press("Shift+End");

  await page.waitForTimeout(500);

  await page.keyboard.press("Backspace");

  await page.waitForTimeout(200);

  await page.click(getTestId("notes-action-button"));

  await page.click(selector);

  await page.waitForSelector(".ProseMirror");

  await expect(getEditorContent()).resolves.toBe("");
});

test.skip("last line doesn't get saved if it's font is different", async () => {
  const selector = await createNoteAndCheckPresence();

  await page.keyboard.press("Enter");

  await page.click(`#editorToolbar button[title="Fonts"]`);

  await page.click(`div[title="Serif"]`);

  await page.type(".ProseMirror", "I am another line in Serif font.");

  await page.waitForTimeout(200);

  await page.click(getTestId("notes-action-button"));

  await page.click(selector);

  const content = await getEditorContentAsHTML();

  expect(content).toMatchSnapshot(`last-line-with-different-font.txt`);
});

test("editing a note and switching immediately to another note and making an edit shouldn't overlap both notes", async ({
  page
}) => {
  await createNoteAndCheckPresence({
    title: "Test note 1",
    content: "53ad8e4e40ebebd0f400498d"
  });

  await createNoteAndCheckPresence({
    title: "Test note 2",
    content: "f054d19e9a2f46eff7b9bb25"
  });

  const selector1 = `[data-item-index="1"] div`;
  const selector2 = `[data-item-index="2"] div`;

  for (let i = 0; i < 10; ++i) {
    await page.click(selector2);

    await editNote(null, `Test note 1 (${i}) `, true);

    await page.click(selector1);

    await editNote(null, `Test note 2 (${i})`, true);

    await page.waitForTimeout(100);
  }

  await page.click(selector1);
  expect(await getEditorContent()).toMatchSnapshot(
    `fast-switch-and-edit-note-2.txt`
  );

  await page.click(selector2);
  expect(await getEditorContent()).toMatchSnapshot(
    `fast-switch-and-edit-note-1.txt`
  );
});

test("editing a note and switching immediately to another note and editing the title shouldn't overlap both notes", async ({
  page
}, testInfo) => {
  testInfo.setTimeout(0);
  await createNoteAndCheckPresence({
    title: "Test note 1",
    content: "53ad8e4e40ebebd0f400498d"
  });

  await createNoteAndCheckPresence({
    title: "Test note 2",
    content: "f054d19e9a2f46eff7b9bb25"
  });

  const selector1 = `[data-item-index="1"] div`;
  const selector2 = `[data-item-index="2"] div`;

  for (let i = 0; i < 10; ++i) {
    await page.click(selector2);

    await editNote(`Test note 2 (${i})`, null, true);

    await page.click(selector1);

    await editNote(`Test note 2 (${i})`, null, true);

    await page.waitForTimeout(100);
  }

  await page.click(selector1);
  expect(await getEditorTitle()).toMatchSnapshot(
    `fast-switch-and-edit-note-title-2.txt`
  );

  await page.click(selector2);
  expect(await getEditorTitle()).toMatchSnapshot(
    `fast-switch-and-edit-note-title-1.txt`
  );
});

test("editing a note and toggling read-only mode should show updated content", async () => {
  const selector = await createNoteAndCheckPresence();

  await page.click(getTestId("notes-action-button"));

  await page.click(selector);

  await editNote(null, `An edit I made`, false);

  await page.click(getTestId("properties"));

  await page.click(getTestId("properties-readonly"));

  await page.click(getTestId("properties-close"));

  expect(await getEditorContent()).toMatchSnapshot(`readonly-edited-note.txt`);
});
