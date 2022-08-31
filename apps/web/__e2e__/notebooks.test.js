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

/* eslint-disable no-undef */
const { test, expect } = require("@playwright/test");
const { getTestId, createNote, NOTE, NOTEBOOK } = require("./utils");
const {
  navigateTo,
  openContextMenu,
  useContextMenu,
  clickMenuItem,
  confirmDialog
} = require("./utils/actions");
const List = require("./utils/listitemidbuilder");
const Menu = require("./utils/menuitemidbuilder");
const {
  checkNotePresence,
  isPresent,
  checkMenuItemText
} = require("./utils/conditions");

/**
 * @type {Page}
 */
global.page = null;

test.beforeEach(async ({ page: _page, baseURL }) => {
  global.page = _page;
  await page.goto(baseURL);
  await page.waitForSelector(getTestId("routeHeader"));
});

async function fillNotebookDialog(notebook) {
  await page.fill(getTestId("and-name"), notebook.title);

  await page.fill(getTestId("and-description"), notebook.description);

  for (let i = 0; i < notebook.topics.length; ++i) {
    let topic = notebook.topics[i];
    await page.fill(getTestId(`and-topic`), topic);
    await page.click(getTestId("and-topic-action"));
  }

  await page.click(getTestId("dialog-yes"));
}

async function createNotebook(notebook) {
  await page.click(getTestId("notebooks-action-button"));

  await fillNotebookDialog(notebook);
}

async function createNoteAndCheckPresence(note = NOTE) {
  await createNote(note, "notes");

  // make sure the note has saved.
  await page.waitForTimeout(1000);

  return await checkNotePresence("notes", undefined, note);
}

async function checkNotebookPresence(notebook) {
  const notebookIdBuilder = List.new("notebook").grouped().atIndex(0);

  await expect(
    page.textContent(notebookIdBuilder.title().build())
  ).resolves.toBe(notebook.title);

  await expect(
    page.textContent(notebookIdBuilder.body().build())
  ).resolves.toBe(notebook.description);

  await page.click(List.new("notebook").grouped().atIndex(0).title().build());

  for (let i = 0; i < notebook.topics.length; ++i) {
    await expect(
      page.textContent(List.new("topic").grouped().atIndex(i).title().build())
    ).resolves.toBeTruthy();
  }

  await page.click(getTestId("go-back"));

  return notebookIdBuilder.build();
}

async function createNotebookAndCheckPresence(notebook = NOTEBOOK) {
  await navigateTo("notebooks");

  await createNotebook(notebook);

  return await checkNotebookPresence(notebook);
}

async function deleteNotebookAndCheckAbsence(notebookSelector) {
  await openContextMenu(notebookSelector);

  await page.click(Menu.new("menuitem").item("movetotrash").build());

  // await confirmDialog();

  await page.waitForTimeout(500);

  await expect(page.$(notebookSelector)).resolves.toBeFalsy();

  await navigateTo("trash");

  await expect(
    isPresent(List.new("trash").grouped().atIndex(0).build())
  ).resolves.toBeTruthy();

  await expect(
    page.textContent(List.new("trash").grouped().atIndex(0).title().build())
  ).resolves.toBe(NOTEBOOK.title);

  await expect(
    page.textContent(List.new("trash").grouped().atIndex(0).body().build())
  ).resolves.toBe(NOTEBOOK.description);

  await navigateTo("notebooks");
}

test("create a notebook", async () => await createNotebookAndCheckPresence());

test("create a note inside a notebook", async () => {
  const notebookSelector = await createNotebookAndCheckPresence();

  await page.click(notebookSelector);

  await page.click(List.new("topic").grouped().atIndex(1).build());

  await createNoteAndCheckPresence();
});

test("edit a notebook", async () => {
  const notebookSelector = await createNotebookAndCheckPresence();

  await useContextMenu(notebookSelector, () => clickMenuItem("edit"));

  const notebook = {
    title: "An Edited Notebook",
    description: "A new edited description",
    topics: ["Topic 1", "Topic 2", "Topic 3"]
  };

  await page.fill(getTestId("and-name"), notebook.title);

  await page.fill(getTestId("and-description"), notebook.description);

  for (var i = 0; i < notebook.topics.length; ++i) {
    let id = getTestId(`and-topic-${i}-actions-edit`);
    let topic = notebook.topics[i];
    if ((await page.$(id)) !== null) {
      await page.click(id);
    }
    await page.fill(getTestId("and-topic"), topic);
    await page.click(getTestId("and-topic-action"));
  }

  await confirmDialog();

  await page.waitForTimeout(1000);

  await checkNotebookPresence(notebook);
});

test("edit topics individually", async () => {
  const notebookSelector = await createNotebookAndCheckPresence();

  await page.click(notebookSelector);

  for (let index = 0; index < NOTEBOOK.topics.length; index++) {
    await openContextMenu(List.new("topic").grouped().atIndex(index).build());

    await page.click(Menu.new("menuitem").item("edit").build());

    const editedTopicTitle = "Topic " + index + " edit 1";
    await page.fill(getTestId("item-dialog-title"), editedTopicTitle);

    await page.click(getTestId("dialog-yes"));

    await page.waitForTimeout(500);

    await expect(
      page.textContent(List.new("topic").grouped().atIndex(0).title().build())
    ).resolves.toBe(editedTopicTitle);
  }
});

test("delete a notebook", async () => {
  const notebookSelector = await createNotebookAndCheckPresence();

  await deleteNotebookAndCheckAbsence(notebookSelector);
});

test("permanently delete a notebook", async () => {
  const notebookSelector = await createNotebookAndCheckPresence();

  await deleteNotebookAndCheckAbsence(notebookSelector);

  await navigateTo("trash");

  await openContextMenu(List.new("trash").grouped().atIndex(0).build());

  await clickMenuItem("delete");

  await confirmDialog();

  await expect(
    page.$(List.new("trash").grouped().atIndex(0).build())
  ).resolves.toBeFalsy();
});

test("pin a notebook", async ({ page }) => {
  const notebookSelector = await createNotebookAndCheckPresence();

  await useContextMenu(notebookSelector, () => clickMenuItem("pin"));

  // wait for the menu to properly close
  await page.waitForTimeout(500);

  await useContextMenu(
    notebookSelector,
    async () => await checkMenuItemText("pin", "Unpin")
  );

  // wait for the menu to properly close
  await page.waitForTimeout(500);
});
