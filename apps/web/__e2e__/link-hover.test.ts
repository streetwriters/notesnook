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

import { AppModel } from "./models/app.model";
import { test, expect } from "@nn/test";

test("link hover popup stays open over a table column resize handle", async ({
  page
}) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  await notes.newNote();
  await notes.editor.setTitle("Link in a narrow table column");
  await notes.editor.content.focus();
  await page.evaluate(() => {
    const dt = new DataTransfer();
    dt.setData(
      "text/html",
      `<table><tbody>
        <tr><td data-colwidth="60">a</td><td data-colwidth="200">b</td></tr>
        <tr><td data-colwidth="60"><a href="https://example.com">link</a></td><td data-colwidth="200">d</td></tr>
      </tbody></table>`
    );
    document.querySelector(".ProseMirror")!.dispatchEvent(
      new ClipboardEvent("paste", {
        clipboardData: dt,
        bubbles: true,
        cancelable: true
      })
    );
  });

  const link = page.locator(".ProseMirror table a").first();
  const linkBox = (await link.boundingBox())!;
  await page.mouse.move(linkBox.x + 3, linkBox.y + 3);

  const popup = page.locator(".popup-presenter-portal .popup-presenter");
  await expect(popup).toBeVisible();
  const popupBox = (await popup.boundingBox())!;

  // move the cursor across the column border underneath the popup
  const firstRowCells = page.locator(".ProseMirror table tr:first-child td");
  const borderX = (await firstRowCells.first().boundingBox())!;
  const x = borderX.x + borderX.width;
  const y = popupBox.y + popupBox.height / 2;
  await page.mouse.move(x - 4, y, { steps: 10 });
  await page.mouse.move(x, y, { steps: 5 });
  await page.waitForTimeout(500);

  const isPopupOnTop = await page.evaluate(
    ([x, y]) =>
      !!document.elementFromPoint(x, y)?.closest(".popup-presenter-portal"),
    [x, y]
  );
  expect(isPopupOnTop).toBe(true);
  await expect(popup).toBeVisible();
});
