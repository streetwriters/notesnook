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

import path from "node:path";
import type { PlaywrightTestConfig } from "@playwright/test";
import base from "../web/playwright.config";

const config: PlaywrightTestConfig = {
  ...base,
  testDir: path.resolve(__dirname, "../web/__e2e__"),
  outputDir: path.resolve(__dirname, ".local/e2e-web/results"),
  webServer: {
    command: "npx vite preview --config vite.config.web.ts --port 3000 --strictPort",
    cwd: __dirname,
    port: 3000,
    timeout: 120 * 1000,
    reuseExistingServer: true
  },
  timeout: 60 * 1000,
  expect: { timeout: 3 * 1000 },
  retries: 0,
  workers: 8,
  fullyParallel: true
};

export default config;
