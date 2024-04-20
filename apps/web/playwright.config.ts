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

import { PlaywrightTestConfig } from "@playwright/test";

const IS_CI = !!process.env.CI;

const config: PlaywrightTestConfig = {
  webServer: {
    command: "npm run start:test",
    port: 3000,
    timeout: 60 * 1000,
    reuseExistingServer: false
  },
  // Look for test files in thcleare "tests" directory, relative to this configuration file
  testDir: "__e2e__",

  timeout: IS_CI ? 60 * 1000 : 30 * 1000,
  workers: IS_CI ? 2 : 2,
  reporter: "list",
  retries: IS_CI ? 1 : 0,
  fullyParallel: true,
  preserveOutput: "failures-only",
  outputDir: "test-results",
  use: {
    baseURL: "http://localhost:3000/",
    headless: true,
    acceptDownloads: true,

    // Artifacts
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retry-with-video",

    viewport: {
      width: 1280,
      height: 720
    }
  },
  projects: IS_CI
    ? [
        {
          name: "Chromium",
          use: {
            browserName: "chromium"
          }
        }
      ]
    : [
        {
          name: "Chromium",
          use: {
            browserName: "chromium",
            permissions: ["notifications"]
          }
        }
        // {
        //   name: "Firefox",
        //   use: {
        //     browserName: "firefox",
        //     permissions: ["notifications"]
        //   }
        // },we
        // {
        //   name: "WebKit",
        //   use: {
        //     browserName: "webkit"
        //   }
        // }
      ]
};

export default config;
