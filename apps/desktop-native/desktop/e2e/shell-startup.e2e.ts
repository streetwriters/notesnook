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
import { count, seedNotes, texts } from "./dialogs";

const DELAY = 6000;
const SHELL = [
  "app",
  "tabs",
  "sidebar-toggle",
  "navigation-menu-root",
  "tab-home",
  "routeHeader",
  "route-title",
  "status-bar",
  "editor-placeholder"
];

let app: DesktopApp | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

async function open(dataDir: string, initialProps: Record<string, unknown>) {
  app = await launchApp({
    disableAnimations: true,
    timeout: 180000,
    initialProps,
    env: { RN_GPUI_APP_DATA_DIR: dataDir }
  });
  return app;
}

async function waitFor(id: string, timeout = 90000) {
  await vi.waitFor(
    async () => expect(await count(app!, id), id).toBeGreaterThan(0),
    { timeout, interval: 200 }
  );
}

test("the shell is on screen before the database is ready and content fills in after", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "notesnook-e2e-"));
  await open(dir, {
    resetConfig: true,
    seed: seedNotes,
    delayDatabaseMs: DELAY
  });
  await waitFor("app");
  const shownAt = Date.now();

  for (const id of SHELL) expect(await count(app!, id), id).toBeGreaterThan(0);
  expect(await texts(app!, "route-title")).toContain("Notes");
  expect(await count(app!, "list-placeholder")).toBe(0);
  expect(await count(app!, "list-item")).toBe(0);
  expect(await count(app!, "authForm")).toBe(0);
  expect(await texts(app!, "item-count")).not.toContain("0");
  expect(await texts(app!, "title")).not.toContain("Apple pie");

  await vi.waitFor(
    async () => expect(await texts(app!, "title")).toContain("Apple pie"),
    { timeout: 90000, interval: 300 }
  );
  expect(Date.now() - shownAt).toBeGreaterThan(DELAY / 2);
  expect(await count(app!, "list-placeholder")).toBe(0);
  expect(await count(app!, "list-item")).toBe(seedNotes.length);
  await vi.waitFor(
    async () => expect(await texts(app!, "item-count")).toContain("3"),
    { timeout: 20000, interval: 300 }
  );
});

test("an empty database shows the placeholder only once it is loaded", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "notesnook-e2e-"));
  await open(dir, { resetConfig: true, delayDatabaseMs: DELAY });
  await waitFor("app");
  expect(await count(app!, "list-placeholder")).toBe(0);
  expect(await texts(app!, "item-count")).not.toContain("0");
  await waitFor("list-placeholder");
  await vi.waitFor(
    async () => expect(await texts(app!, "item-count")).toContain("0"),
    { timeout: 20000, interval: 300 }
  );
});

test("a pending click on New note waits for the database and does not fail", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "notesnook-e2e-"));
  await open(dir, { resetConfig: true, delayDatabaseMs: DELAY });
  await waitFor("create-note-button");
  const [button] = await app!.query("testID", "create-note-button", true);
  await app!.click(button.tag);
  await waitFor("list-placeholder");
  expect(await count(app!, "boot-state")).toBe(0);
  expect(await count(app!, "app")).toBeGreaterThan(0);
});

test("with app lock enabled the unlock screen is the first frame and no list renders behind it", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "notesnook-e2e-"));
  await open(dir, {
    resetConfig: true,
    seed: seedNotes,
    seedAppLockPassword: "secret"
  });
  await waitFor("unlock-note-title");
  await app!.close();

  await open(dir, { delayDatabaseMs: DELAY });
  await waitFor("unlock-note-title");
  for (const id of [
    "app",
    "navigation-menu-root",
    "routeHeader",
    "list-item",
    "list-placeholder",
    "status-bar"
  ])
    expect(await count(app!, id), id).toBe(0);

  await new Promise((resolve) => setTimeout(resolve, DELAY + 2000));
  expect(await count(app!, "unlock-note-title")).toBe(1);
  expect(await count(app!, "list-item")).toBe(0);
  expect(await count(app!, "app")).toBe(0);

  await waitFor("app-lock-password");
  const [field] = await app!.query("testID", "app-lock-password", true);
  await app!.click(field.tag);
  await app!.typeText(field.tag, "secret");
  await app!.press("enter");
  await waitFor("app");
  await vi.waitFor(
    async () => expect(await texts(app!, "title")).toContain("Apple pie"),
    { timeout: 30000, interval: 300 }
  );
}, 180000);
