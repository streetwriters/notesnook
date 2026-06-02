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
/* eslint-disable no-empty-pattern */

import { AppContext, buildAndLaunchApp, TestOptions } from "./utils";
import path from "path";
import { version } from "../../package.json";
import type { Browser, ElectronApplication, Page } from "@playwright/test";
import type { TraceViewerFixtures } from "./trace-viewer-fixtures";
import { traceViewerFixtures } from "./trace-viewer-fixtures";
import { PageTestFixtures, PageWorkerFixtures } from "./page-test-api";
import fs from "fs";
import { tmpdir } from "os";
import { baseTest } from "./base-test";

export type ElectronTestFixtures = PageTestFixtures & {
  electronApp: ElectronApplication;
  launchElectronApp: (options?: TestOptions) => Promise<ElectronApplication>;
  createUserDataDir: () => Promise<string>;
  options: TestOptions;
  newPage: () => Promise<Page>;
};

export type { Page, Browser } from "@playwright/test";
export { expect } from "@playwright/test";
export const test = baseTest
  .extend<TraceViewerFixtures>(traceViewerFixtures)
  .extend<ElectronTestFixtures, PageWorkerFixtures>({
    browserVersion: [
      ({}, use) => use(process.env.ELECTRON_CHROMIUM_VERSION!),
      { scope: "worker" }
    ],
    browserMajorVersion: [
      ({}, use) =>
        use(Number(process.env.ELECTRON_CHROMIUM_VERSION!.split(".")[0])),
      { scope: "worker" }
    ],
    electronMajorVersion: [
      ({}, use) =>
        use(
          parseInt(require("electron/package.json").version.split(".")[0], 10)
        ),
      { scope: "worker" }
    ],
    isBidi: [false, { scope: "worker" }],
    isAndroid: [false, { scope: "worker" }],
    isElectron: [true, { scope: "worker" }],
    isHeadlessShell: [false, { scope: "worker" }],
    isFrozenWebkit: [false, { scope: "worker" }],

    createUserDataDir: async ({}, run) => {
      const dirs: string[] = [];
      // We do not put user data dir in testOutputPath,
      // because we do not want to upload them as test result artifacts.
      await run(async () => {
        const dir = await fs.promises.mkdtemp(
          path.join(tmpdir(), "playwright-test-")
        );
        dirs.push(dir);
        return dir;
      });
      await removeFolders(dirs);
    },

    launchElectronApp: async ({ createUserDataDir }, use) => {
      // This env prevents 'Electron Security Policy' console message.
      process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";
      const apps: AppContext[] = [];
      await use(async (options?: TestOptions) => {
        const userDataDir = await createUserDataDir();
        const ctx = await buildAndLaunchApp(
          userDataDir,
          options || {
            version,
            config: {}
          }
        );
        apps.push(ctx);
        return ctx.app;
      });
      for (const ctx of apps) {
        await ctx.app.close();
      }
      await removeFolders(apps.map((ctx) => ctx.outputDir));
    },

    electronApp: async ({ launchElectronApp, options }, use) => {
      await use(await launchElectronApp(options));
    },

    page: async ({ electronApp, viewport }, run) => {
      const page = await electronApp.firstWindow();
      if (viewport) {
        await page.setViewportSize(viewport);
        await electronApp.evaluate((p, viewport) => {
          const mainWindow = p.BrowserWindow.getAllWindows()[0];
          mainWindow.setSize(viewport.width, viewport.height);
        }, viewport);
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      page.context().app = electronApp;
      await run(page);
    },

    context: async ({ electronApp }, run) => {
      await run(electronApp.context());
    },

    newPage: async ({ launchElectronApp, options }, use) => {
      await use(async () => {
        const app = await launchElectronApp(options);
        return app.firstWindow();
      });
    },

    options: async ({}, use) => {
      await use({
        version,
        config: {}
      });
    }
  });

async function removeFolders(folders: string[]) {
  await Promise.all(
    folders.map((folder) =>
      fs.promises.rm(folder, {
        force: true,
        recursive: true,
        maxRetries: 3,
        retryDelay: 5000
      })
    )
  );
}
