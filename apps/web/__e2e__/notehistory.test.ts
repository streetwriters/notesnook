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

import { test, expect, Page } from "@playwright/test";
import { AppModel } from "./models/app.model";
import { NOTE, PASSWORD } from "./utils";

test.setTimeout(60 * 1000);

async function createSession(page: Page, locked = false) {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  let note = await notes.createNote(NOTE);

  if (locked) {
    await note?.contextMenu.lock(PASSWORD);
    await note?.openLockedNote(PASSWORD);
  }

  const edits = ["Some edited text.", "Some more edited text."];
  for (const edit of edits) {
    await notes.editor.setContent(edit);

    await page.waitForTimeout(600);

    await page.reload().catch(console.error);
    await notes.waitForItem(NOTE.title);
    note = await notes.findNote(NOTE);
    locked ? await note?.openLockedNote(PASSWORD) : await note?.openNote();
  }
  const contents = [
    `${NOTE.content}${edits[0]}${edits[1]}`,
    `${NOTE.content}${edits[0]}`
  ];

  return {
    note,
    notes,
    app,
    contents
  };
}

const sessionTypes = ["locked", "unlocked"] as const;

for (const type of sessionTypes) {
  const isLocked = type === "locked";

  test(`editing a note should create a new ${type} session in its session history`, async ({
    page
  }) => {
    const { note } = await createSession(page, isLocked);

    const history = await note?.properties.getSessionHistory();
    expect(history?.length).toBeGreaterThan(1);

    if (isLocked) {
      for (const item of history || []) {
        expect(await item.isLocked()).toBeTruthy();
      }
    }
  });

  test(`switching ${type} sessions should change editor content`, async ({
    page
  }) => {
    const { note, contents } = await createSession(page, isLocked);

    const history = await note?.properties.getSessionHistory();
    let preview = await history?.at(1)?.open();
    if (type === "locked") await preview?.unlock(PASSWORD);

    await expect(preview!.firstEditor.locator(".ProseMirror")).toHaveText(
      contents[1]
    );
    await note?.click();
    await note?.properties.close();
    preview = await history?.at(0)?.open();
    if (type === "locked") await preview?.unlock(PASSWORD);

    await expect(preview!.firstEditor.locator(".ProseMirror")).toHaveText(
      contents[0]
    );
  });

  test(`restoring a ${type} session should change note's content`, async ({
    page
  }) => {
    const { note, notes, contents } = await createSession(page, isLocked);
    const history = await note?.properties.getSessionHistory();
    const preview = await history?.at(1)?.open();
    if (type === "locked") await preview?.unlock(PASSWORD);

    await preview?.restore();

    await page.waitForTimeout(1000);
    if (type === "locked") await note?.openLockedNote(PASSWORD);
    expect(await notes.editor.getContent("text")).toBe(contents[1]);
  });
}
// test("editing locked note should create locked history sessions", async ({
//   page
// }) => {
//   const { note } = await createLockedSession(page);

//   const history = await note?.properties.getSessionHistory();
//   expect(history).toHaveLength(2);
// for (const item of history || []) {
//   expect(await item.isLocked()).toBeTruthy();
// }
// });

// test("switching locked sessions should change editor content", async ({
//   page
// }) => {
//   const { note, notes, contents } = await createLockedSession(page);

//   const history = await note?.properties.getSessionHistory();
//   await history?.at(1)?.previewLocked(PASSWORD);
//   await notes.editor.waitForLoading(NOTE.title, contents[1]);
//   const content1 = await notes.editor.getContent("text");

//   await history?.at(0)?.previewLocked(PASSWORD);
//   await notes.editor.waitForLoading(NOTE.title, contents[0]);
//   const content0 = await notes.editor.getContent("text");

//   expect(content1).toBe(contents[1]);
//   expect(content0).toBe(contents[0]);
// });

// test("restore a locked session", async ({ page }) => {
//   const { note, notes, contents } = await createLockedSession(page);
//   const history = await note?.properties.getSessionHistory();
//   await history?.at(1)?.previewLocked(PASSWORD);
//   await notes.editor.waitForLoading(NOTE.title, contents[1]);

//   await notes.editor.restoreSession();

//   const content = await notes.editor.getContent("text");
//   expect(content).toBe(contents[1]);
// });
