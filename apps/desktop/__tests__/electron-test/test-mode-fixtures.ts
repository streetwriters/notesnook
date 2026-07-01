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

import { test } from "@playwright/test";
import type { TestModeName } from "./test-mode";
import { DefaultTestMode, DriverTestMode } from "./test-mode";

export type TestModeWorkerOptions = {
  mode: TestModeName;
};

export type TestModeTestFixtures = {
  toImpl: (rpcObject?: any) => any;
};

export type TestModeWorkerFixtures = {
  toImplInWorkerScope: (rpcObject?: any) => any;
  playwright: typeof import("@playwright/test");
};

export const testModeTest = test.extend<
  TestModeTestFixtures,
  TestModeWorkerOptions & TestModeWorkerFixtures
>({
  mode: ["default", { scope: "worker", option: true }],
  playwright: [
    async ({ mode }, run) => {
      const testMode = {
        default: new DefaultTestMode(),
        service: new DefaultTestMode(),
        service2: new DefaultTestMode(),
        "service-grid": new DefaultTestMode(),
        wsl: new DefaultTestMode(),
        driver: new DriverTestMode()
      }[mode];
      const playwright = await testMode.setup();
      await run(playwright);
      await testMode.teardown();
    },
    { scope: "worker" }
  ],

  toImplInWorkerScope: [
    async ({ playwright }, use) => {
      await use((playwright as any)._connection.toImpl);
    },
    { scope: "worker" }
  ],

  toImpl: async (
    { toImplInWorkerScope: toImplWorker, mode },
    use,
    testInfo
  ) => {
    if (mode !== "default" || process.env.PW_TEST_REUSE_CONTEXT)
      testInfo.skip();
    await use(toImplWorker);
  }
});
