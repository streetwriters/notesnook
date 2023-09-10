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
import { androidTest } from "./test-utils";
import { getKey, setKeyboard, type } from "./keyboard-utils";

androidTest(
  "backspacing from new line should not change caret position",
  async ({ chrome, device, keyboards, baseURL, size }, info) => {
    info.setTimeout(30000);

    for (const keyboard of keyboards) {
      await test.step(keyboard.name, async () => {
        if (!(await setKeyboard(device, keyboard.ime)))
          throw new Error("Failed to set keyboard.");

        const page = await chrome.newPage();

        await page.goto(baseURL);

        await page.focus(".ProseMirror");

        await page.waitForTimeout(1000);

        await type(page, device, keyboard, size, "HI\nLA");

        await page.waitForTimeout(100);

        await page.keyboard.press("ArrowLeft");
        await page.keyboard.press("ArrowLeft");

        await device.input.tap(getKey(keyboard, size, "DEL"));

        await page.waitForTimeout(100);

        await type(page, device, keyboard, size, "HO");

        expect((await page.textContent(".ProseMirror"))?.toLowerCase()).toBe(
          "hihola"
        );

        await page.close();
      });
    }
  }
);

androidTest(
  "pressing enter after entering a word should move the caret to the new line",
  async ({ chrome, device, keyboards, baseURL, size }, info) => {
    info.setTimeout(30000);

    for (const keyboard of keyboards) {
      await test.step(keyboard.name, async () => {
        if (!(await setKeyboard(device, keyboard.ime)))
          throw new Error("Failed to set keyboard.");

        const page = await chrome.newPage();

        await page.goto(baseURL);

        await page.focus(".ProseMirror");

        await page.waitForTimeout(1000);

        await type(page, device, keyboard, size, "HELLO");

        await page.waitForTimeout(100);

        await type(page, device, keyboard, size, "\nWORLD");

        expect((await page.innerHTML(".ProseMirror"))?.toLowerCase()).toBe(
          '<p data-spacing="double">hello</p><p data-spacing="double">world</p>'
        );

        await page.close();
      });
    }
  }
);
