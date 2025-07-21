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

import { test as vitestTest, TestContext } from "vitest";
import { buildAndLaunchApp, Fixtures, TestOptions } from "./utils";
import { mkdir, rm } from "fs/promises";
import path from "path";
import slugify from "slugify";

export const test = vitestTest.extend<Fixtures>({
  options: { version: "3.0.0" } as TestOptions,
  ctx: async ({ options }, use) => {
    const ctx = await buildAndLaunchApp(options);
    await use(ctx);
  }
});

export async function testCleanup(context: TestContext) {
  const ctx = (context.task.context as unknown as Fixtures).ctx;
  if (context.task.result?.state === "fail") {
    await mkdir("test-results", { recursive: true });
    await ctx.page.screenshot({
      path: path.join(
        "test-results",
        `${slugify(context.task.name)}-${process.platform}-${
          process.arch
        }-error.png`
      )
    });
  }
  await ctx.app.close();
  await rm(ctx.userDataDir, {
    force: true,
    recursive: true,
    maxRetries: 3,
    retryDelay: 5000
  }).catch(() => {
    /*ignore */
  });
  await rm(ctx.outputDir, {
    force: true,
    recursive: true,
    maxRetries: 3,
    retryDelay: 5000
  }).catch(() => {
    /*ignore */
  });
}
