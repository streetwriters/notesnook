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

import { test } from "vitest";
import { harness } from "./utils.js";
import assert from "assert";
import { writeFile } from "fs/promises";

test("update starts downloading if version is outdated", async (t) => {
  await harness(
    t,
    async ({ page }) => {
      await page.waitForSelector("#authForm");

      assert.ok(
        await page.getByRole("button", { name: "Create account" }).isVisible()
      );

      await page
        .getByRole("button", { name: "Skip & go directly to the app" })
        .click();

      await page
        .waitForSelector(".ReactModal__Content", {
          timeout: 1000
        })
        .catch(() => {})
        .then(async () => {
          const positiveButton = page.locator(
            "button[data-role='positive-button']"
          );
          const negativeButton = page.locator(
            "button[data-role='negative-button']"
          );
          if (await positiveButton.isVisible()) await positiveButton.click();
          else if (await negativeButton.isVisible())
            await negativeButton.click();
        });

      await page.waitForSelector(".ProseMirror");

      await page
        .locator(".theme-scope-statusBar")
        .getByRole("button", { name: /updating/i })
        .waitFor({ state: "attached" });
    },
    { version: "3.0.0" }
  );
});

test("update is only shown if version is outdated and auto updates are disabled", async (t) => {
  await harness(
    t,
    async (ctx) => {
      await ctx.app.close();
      await writeFile(
        ctx.configPath,
        JSON.stringify({
          automaticUpdates: false
        })
      );

      await ctx.relaunch();

      const { page } = ctx;

      await page.waitForSelector("#authForm");

      assert.ok(
        await page.getByRole("button", { name: "Create account" }).isVisible()
      );

      await page
        .getByRole("button", { name: "Skip & go directly to the app" })
        .click();

      await page
        .waitForSelector(".ReactModal__Content", {
          timeout: 1000
        })
        .catch(() => {})
        .then(async () => {
          const positiveButton = page.locator(
            "button[data-role='positive-button']"
          );
          const negativeButton = page.locator(
            "button[data-role='negative-button']"
          );
          if (await positiveButton.isVisible()) await positiveButton.click();
          else if (await negativeButton.isVisible())
            await negativeButton.click();
        });

      await page.waitForSelector(".ProseMirror");

      await page
        .locator(".theme-scope-statusBar")
        .getByRole("button", { name: /available/i })
        .waitFor({ state: "attached" });
    },
    { version: "3.0.0" }
  );
});
