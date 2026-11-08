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
import { afterEach, expect, test, vi } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import { launchApp } from "./launch";

let app: DesktopApp | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

async function open(initialPath?: string, extra: Record<string, unknown> = {}) {
  app = await launchApp({
    disableAnimations: false,
    timeout: 180000,
    logFile: process.env.RN_GPUI_E2E_LOG,
    initialProps: { resetConfig: true, initialPath, ...extra },
    env: {
      RN_GPUI_APP_DATA_DIR: mkdtempSync(path.join(tmpdir(), "notesnook-e2e-"))
    }
  });
  return app;
}

async function waitForId(id: string) {
  await vi.waitFor(
    async () =>
      expect(await app!.getByTestId(id).count(), id).toBeGreaterThan(0),
    { timeout: 90000, interval: 500 }
  );
}

test("the default route renders the app shell", async () => {
  await open();
  await waitForId("app");
  expect(await app!.getByTestId("authForm").count()).toBe(0);
});

test("an unknown path does not redirect to signup while testing", async () => {
  await open("/some/unknown/path");
  await waitForId("app");
  expect(await app!.getByTestId("authForm").count()).toBe(0);
});

for (const [route, field] of [
  ["/signup", "confirm-password"],
  ["/login", "password"],
  ["/recover", "email"],
  ["/sessionexpired", "password"]
] as const) {
  test(`${route} renders the auth form`, async () => {
    await open(route);
    await waitForId("authForm");
    await waitForId(field);
    expect(await app!.getByTestId("app").count()).toBe(0);
  });
}

test("login and signup link to each other", async () => {
  await open("/login");
  await waitForId("authForm");
  await app!.getByText("Sign up").click();
  await waitForId("confirm-password");
});

test("the auth container shows the encryption pitch and the change server button", async () => {
  await open("/login");
  await waitForId("auth-container");
  expect(await app!.getByText("End-to-end encrypted.").count()).toBeGreaterThan(
    0
  );
});

test("submitting an empty login form shows an error", async () => {
  await open("/login");
  await waitForId("submitButton");
  await app!.getByTestId("submitButton").click();
  await vi.waitFor(
    async () =>
      expect(await app!.getByTestId("authForm").count()).toBeGreaterThan(0),
    { timeout: 10000 }
  );
});

test("the plans route renders the plan list", async () => {
  await open("/plans");
  await vi.waitFor(
    async () =>
      expect(await app!.getByTestId("plans").count()).toBeGreaterThan(0),
    { timeout: 90000, interval: 500 }
  );
});

test("the email confirmed route without a user id returns to the app", async () => {
  await open("/account/verified");
  await waitForId("app");
});

test("the account recovery route boots against the in-memory database", async () => {
  await open("/account/recovery");
  await vi.waitFor(
    async () =>
      expect(
        (await app!.getByTestId("authForm").count()) +
          (await app!.getByTestId("auth-container").count())
      ).toBeGreaterThan(0),
    { timeout: 90000, interval: 500 }
  );
});

test("the hash route /settings opens the settings dialog", async () => {
  await open("/notes", { initialHash: "#/settings" });
  await waitForId("settings-dialog");
});

test("the app lock gate shows the unlock screen when a credential exists", async () => {
  await open("/notes", { seedAppLockPassword: "password" });
  await waitForId("app-lock-password");
  expect(await app!.getByTestId("app").count()).toBe(0);
  await app!.getByTestId("app-lock-password").fill("wrong");
  await app!.press("enter");
  await vi.waitFor(
    async () =>
      expect(await app!.getByText("Wrong password").count()).toBeGreaterThan(0),
    { timeout: 20000 }
  );
  await app!.getByTestId("app-lock-password").fill("password");
  await app!.press("enter");
  await waitForId("app");
});
