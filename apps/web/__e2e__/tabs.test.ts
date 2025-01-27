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

  const tabs = await notes.editor.getTabs();
  expect(tabs.length).toBe(2);
  expect(await tabs[1].title()).toBe("Note 2");
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

  const tabs = await notes.editor.getTabs();
  expect(tabs.length).toBe(2);
  expect(await tabs[1].title()).toBe("Note 2");
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
  expect(await tabs[0].title()).toBe("Note 2");
  await notes.editor.goBack();
  expect(await tabs[0].title()).toBe("Note 1");
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
  expect(await tabs[0].title()).toBe("Note 2");
  await notes.editor.goForward();
  expect(await tabs[0].title()).toBe("Note 3");
});

test("new tab button should open a new tab", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  await notes.createNote({ title: "Note 1" });

  await notes.editor.newTab();

  const tabs = await notes.editor.getTabs();
  expect(await tabs[0].title()).toBe("Note 1");
  expect(await tabs[1].title()).toBe("Untitled");
});
