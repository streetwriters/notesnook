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

import test from "node:test";
import { launchApp } from "./utils.mjs";
import assert from "assert";
import slugify from "slugify";
import path from "path";
import { mkdir } from "fs/promises";

test("make sure app loads", async (t) => {
  const { app, page } = await launchApp();
  try {
    await page.waitForSelector("#authForm");

    assert.ok(
      await page.getByRole("button", { name: "Create account" }).isVisible()
    );

    await page
      .getByRole("button", { name: "Skip & go directly to the app" })
      .click();

    await page.waitForSelector(".ProseMirror");
  } catch (e) {
    await mkdir("test-results", { recursive: true });
    await page.screenshot({
      path: path.join(
        "test-results",
        `${slugify(t.name)}-${process.platform}-${process.arch}-error.png`
      )
    });
    throw e;
  } finally {
    await app.close();
  }
});
