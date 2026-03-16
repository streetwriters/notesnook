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

import {
  test as base,
  PlaywrightTestArgs,
  PlaywrightTestOptions,
  PlaywrightWorkerArgs,
  PlaywrightWorkerOptions
} from "@playwright/test";
import { ElectronTestFixtures } from "../../../desktop/__tests__/electron-test";

export { expect } from "@playwright/test";
export type { Page, Browser } from "@playwright/test";
export type TestArgs = PlaywrightTestArgs &
  PlaywrightTestOptions &
  PlaywrightWorkerArgs &
  PlaywrightWorkerOptions &
  Partial<ElectronTestFixtures>;
export const test = base.extend<
  NonNullable<unknown> & Partial<ElectronTestFixtures>
>({
  page: async ({ page }, use) => {
    const client = await page.context().newCDPSession(page);
    await client.send("Emulation.setCPUThrottlingRate", {
      rate: 1
    });
    await use(page);
  },
  newPage: async ({ browser }, use) => {
    await use(async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      return page;
    });
  }
});
