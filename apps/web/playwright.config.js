/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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

const IS_CI = !!process.env.CI;

const projects = IS_CI
  ? [
      // {
      //   name: "Firefox",
      //   use: { browserName: "firefox" }
      // },
      // {
      //   name: "WebKit",
      //   use: { browserName: "webkit" }
      // },
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
          browserName: "chromium"
        }
      },
      {
        name: "Firefox",
        use: { browserName: "firefox" }
      },
      {
        name: "WebKit",
        use: { browserName: "webkit" }
      }
    ];

module.exports = {
  webServer: {
    command: "npm run start:test",
    port: 3000,
    timeout: 60 * 1000,
    reuseExistingServer: true
  },
  // Look for test files in thcleare "tests" directory, relative to this configuration file
  testDir: "__e2e__",

  // Each test is given 30 seconds
  timeout: 30000,
  workers: IS_CI ? 2 : 2,
  reporter: "list",
  retries: IS_CI ? 1 : 0,
  fullyParallel: true,
  use: {
    baseURL: "http://localhost:3000/",
    headless: true,
    acceptDownloads: true,

    // Artifacts
    trace: IS_CI ? "off" : "retain-on-failure",
    screenshot: IS_CI ? "off" : "only-on-failure",
    video: IS_CI ? "off" : "retry-with-video",

    viewport: {
      width: 1280,
      height: 720
    },
    screen: {
      width: 1280,
      height: 720
    }
  },
  projects
};
