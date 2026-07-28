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

import { test, expect } from "@nn/test";
import type { ElectronApplication } from "@playwright/test";

async function getMainWindowState(app: ElectronApplication) {
  return await app.evaluate((window) => {
    const { BrowserWindow } = window;
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) throw new Error("Main window not found");
    return {
      isMinimized: mainWindow.isMinimized(),
      isVisible: mainWindow.isVisible()
    };
  });
}

test("make sure app loads", async ({ page }) => {
  await page.waitForSelector(".ProseMirror");
});

test("hidden launch minimizes when tray is disabled", async ({
  launchElectronApp,
  options
}) => {
  const app = await launchElectronApp({
    version: options.version,
    args: ["--hidden"],
    config: {
      desktopSettings: {
        minimizeToSystemTray: false,
        closeToSystemTray: false
      }
    }
  });

  const page = await app.firstWindow();
  await page.waitForSelector(".ProseMirror");

  const state = await getMainWindowState(app);
  expect(state.isMinimized).toBe(true);
});

test("hidden launch does not minimize when close-to-tray is enabled", async ({
  launchElectronApp,
  options
}) => {
  const app = await launchElectronApp({
    version: options.version,
    args: ["--hidden"],
    config: {
      desktopSettings: {
        minimizeToSystemTray: false,
        closeToSystemTray: true
      }
    }
  });

  const page = await app.firstWindow();
  await page.waitForSelector(".ProseMirror");

  const state = await getMainWindowState(app);
  expect(state.isMinimized).toBe(false);
});
