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

import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import { launchApp } from "./launch";

const checks = [
  "config",
  "kvstore",
  "safestorage",
  "random",
  "xxh64",
  "digest",
  "aesgcm",
  "aeskw",
  "pbkdf2",
  "hkdf",
  "imagecompressor",
  "files",
  "attachments",
  "clipboard",
  "notifications",
  "spellchecker",
  "keyboard",
  "lifecycle",
  "integration",
  "updater",
  "pdf",
  "webauthn",
  "database",
  "environment"
] as const;

let app: DesktopApp;

beforeAll(async () => {
  app = await launchApp({
    disableAnimations: true,
    timeout: 180000,
    logFile: process.env.RN_GPUI_E2E_LOG,
    initialProps: {
      screen: "platform",
      resetConfig: true,
      softAuthenticatorPin: "1234"
    },
    env: {
      RN_GPUI_APP_DATA_DIR: mkdtempSync(path.join(tmpdir(), "notesnook-e2e-"))
    }
  });
  await vi.waitFor(
    async () =>
      expect(await app.getByTestId("platform-smoke").count()).toBeGreaterThan(
        0
      ),
    { timeout: 90000, interval: 500 }
  );
});

afterAll(async () => {
  await app.close();
});

async function result(name: string) {
  return app.getByTestId(`check-${name}`).textContent();
}

for (const name of checks) {
  test(`platform check ${name} passes`, async () => {
    await vi.waitFor(async () => expect(await result(name)).toBe("ok"), {
      timeout: name === "webauthn" || name === "spellchecker" ? 120000 : 30000,
      interval: 500
    });
  });
}

test("every check is listed on the screen", async () => {
  for (const name of checks)
    expect(await app.getByTestId(`check-${name}`).count(), name).toBe(1);
});

test("the checks can be run again on demand", async () => {
  await app.getByTestId("run-checks").click();
  for (const name of checks)
    await vi.waitFor(async () => expect(await result(name)).toBe("ok"), {
      timeout: name === "webauthn" || name === "spellchecker" ? 120000 : 30000,
      interval: 500
    });
});
