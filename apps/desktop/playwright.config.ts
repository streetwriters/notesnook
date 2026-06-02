/* eslint-disable header/header */
/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type {
  Config,
  PlaywrightTestOptions,
  PlaywrightWorkerOptions
} from "@playwright/test";
import * as path from "path";

process.env.PWPAGE_IMPL = "electron";
process.env.TEST_DESKTOP = "true";
const outputDir = path.join(__dirname, "test-results");
const testDir = path.join(__dirname, "__tests__");
const config: Config<PlaywrightWorkerOptions & PlaywrightTestOptions> = {
  testDir,
  outputDir,
  expect: {
    timeout: 10000
  },
  use: {
    acceptDownloads: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retry-with-video",
    viewport: {
      width: 1920,
      height: 1080
    }
  },
  timeout: 60000,
  globalTimeout: 5400000,
  workers: process.env.CI ? 1 : undefined,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 0,
  reporter: process.env.CI
    ? [["dot"], ["json", { outputFile: path.join(outputDir, "report.json") }]]
    : "line",
  projects: [],
  globalSetup: "./__tests__/electron-test/global-setup.ts"
};

const metadata = {
  platform: process.platform,
  headless: "headed",
  browserName: "electron",
  channel: undefined,
  mode: "default",
  video: false
};

config.projects?.push({
  name: "notesnook-desktop",
  // Share screenshots with chromium.
  snapshotPathTemplate:
    "{testDir}/{testFileDir}/{testFileName}-snapshots/{arg}-electron{ext}",
  use: {
    browserName: "chromium",
    headless: false
  },
  testDir: "__tests__",
  metadata
});

config.projects?.push({
  name: "notesnook-web",
  // Share screenshots with chromium.
  snapshotPathTemplate:
    "{testDir}/{testFileDir}/{testFileName}-snapshots/{arg}-electron{ext}",
  use: {
    browserName: "chromium",
    headless: false
  },
  testDir: path.resolve(__dirname, "../web/__e2e__"),
  metadata
});

export default config;
