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
import { createHistorySession, PASSWORD } from "./utils";

test.setTimeout(60 * 1000);

const sessionTypes = ["locked", "unlocked"] as const;

for (const type of sessionTypes) {
  const isLocked = type === "locked";

  test(`editing a note should create a new ${type} session in its session history`, async ({
    page
  }) => {
    const { note } = await createHistorySession(page, isLocked);

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
    const { note, contents } = await createHistorySession(page, isLocked);

    const history = await note?.properties.getSessionHistory();
    let preview = await history?.at(1)?.open();
    if (type === "locked") await preview?.unlock(PASSWORD);

    await expect(preview!.firstEditor.locator(".ProseMirror")).toHaveText(
      contents[1]
    );
    await note?.click();
    if (type === "locked") await note?.openLockedNote(PASSWORD);
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
    const { note, notes, contents } = await createHistorySession(
      page,
      isLocked
    );
    const history = await note?.properties.getSessionHistory();
    const preview = await history?.at(1)?.open();
    if (type === "locked") await preview?.unlock(PASSWORD);

    await preview?.restore();

    await page.waitForTimeout(1000);
    if (type === "locked") await note?.openLockedNote(PASSWORD);
    expect(await notes.editor.getContent("text")).toBe(contents[1]);
  });
}
