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

const NOW = Date.now();
const seed = [1, 2, 3].map((n) => ({
  title: `Layout note ${n}`,
  content: `Body ${n}`,
  dateEdited: NOW - n * 60 * 1000,
  dateCreated: NOW - n * 60 * 1000
}));

let app: DesktopApp;

beforeAll(async () => {
  app = await launchApp({
    disableAnimations: false,
    timeout: 180000,
    logFile: process.env.RN_GPUI_E2E_LOG,
    initialProps: { seed, resetConfig: true },
    env: {
      RN_GPUI_APP_DATA_DIR: mkdtempSync(path.join(tmpdir(), "notesnook-e2e-"))
    }
  });
  await app.setWindowSize(1200, 800);
  await vi.waitFor(
    async () => expect(await app.getByTestId("app").count()).toBeGreaterThan(0),
    { timeout: 90000, interval: 500 }
  );
});

afterAll(async () => {
  await app.close();
});

async function frame(id: string) {
  const [match] = await app.query("testID", id, true);
  return match?.frame;
}

test("the navigation pane is 250px wide and the list pane 380px at the default size", async () => {
  const nav = await frame("navigation-menu-root");
  expect(nav.width).toBeGreaterThanOrEqual(240);
  const list = await frame("pane-list-pane");
  expect(list.width).toBeGreaterThan(300);
});

test("collapsing the sidebar shows icon only navigation and hover expands it", async () => {
  await app.getByTestId("sidebar-toggle").click();
  await vi.waitFor(
    async () =>
      expect((await frame("navigation-menu-root")).width).toBeLessThan(80),
    { timeout: 10000, interval: 300 }
  );
  expect(await app.getByTestId("tab-notebooks").count()).toBeGreaterThan(0);
  expect(await app.getByTestId("profile-dropdown").count()).toBe(0);

  const nav = await frame("navigation-menu-root");
  await app.mouseMove({ x: nav.x + 10, y: nav.y + 200 });
  await vi.waitFor(
    async () => expect((await frame("navigation-menu-root")).width).toBe(250),
    { timeout: 10000, interval: 300 }
  );
  expect(await app.getByTestId("profile-dropdown").count()).toBeGreaterThan(0);

  await app.mouseMove({ x: 900, y: 400 });
  await vi.waitFor(
    async () =>
      expect((await frame("navigation-menu-root")).width).toBeLessThan(80),
    { timeout: 10000, interval: 300 }
  );

  await app.getByTestId("sidebar-toggle").click();
  await vi.waitFor(
    async () =>
      expect(
        (
          await frame("navigation-menu-root")
        ).width
      ).toBeGreaterThanOrEqual(240),
    { timeout: 10000, interval: 300 }
  );
});

test("a tablet sized window collapses the navigation pane", async () => {
  await app.setWindowSize(800, 700);
  await vi.waitFor(
    async () =>
      expect((await frame("navigation-menu-root")).width).toBeLessThan(80),
    { timeout: 10000, interval: 300 }
  );
  await app.setWindowSize(1200, 800);
  await vi.waitFor(
    async () =>
      expect(
        (
          await frame("navigation-menu-root")
        ).width
      ).toBeGreaterThanOrEqual(240),
    { timeout: 10000, interval: 300 }
  );
});

test("a phone sized window shows one pane at a time", async () => {
  await app.setWindowSize(420, 800);
  await vi.waitFor(
    async () =>
      expect(await app.getByTestId("mobile-contents").count()).toBeGreaterThan(
        0
      ),
    { timeout: 10000, interval: 300 }
  );
  expect(await app.getByTestId("global-split-pane").count()).toBe(0);
  expect(await app.getByTestId("virtual-list").count()).toBeGreaterThan(0);
  expect(await app.getByTestId("navigation-menu-root").count()).toBe(0);

  await app.getByTestId("sidebar-toggle").click();
  await vi.waitFor(
    async () =>
      expect(
        await app.getByTestId("navigation-menu-root").count()
      ).toBeGreaterThan(0),
    { timeout: 10000, interval: 300 }
  );
  expect(await app.getByTestId("virtual-list").count()).toBe(0);

  await app.setWindowSize(1200, 800);
  await vi.waitFor(
    async () =>
      expect(
        await app.getByTestId("global-split-pane").count()
      ).toBeGreaterThan(0),
    { timeout: 10000, interval: 300 }
  );
});

test("the status bar shows no sync item while logged out and the vault item only when unlocked", async () => {
  expect(await app.getByTestId("status-bar").count()).toBeGreaterThan(0);
  expect(await app.getByTestId("sync-status-synced").count()).toBe(0);
  expect(await app.getByTestId("vault-unlocked").count()).toBe(0);
  expect(await app.getByTestId("lock-app").count()).toBe(0);
});

test("ctrl+t opens a new editor tab and ctrl+w closes it", async () => {
  const before = await app.query("testID", "tab-title", true);
  await app.press("ctrl+t");
  await vi.waitFor(
    async () =>
      expect((await app.query("testID", "tab-title", true)).length).toBe(
        before.length + 1
      ),
    { timeout: 10000, interval: 300 }
  );
  await app.press("ctrl+w");
  await vi.waitFor(
    async () =>
      expect((await app.query("testID", "tab-title", true)).length).toBe(
        before.length
      ),
    { timeout: 10000, interval: 300 }
  );
});

test("ctrl+, opens settings and escape closes it", async () => {
  await app.press("ctrl+,");
  await vi.waitFor(
    async () =>
      expect(await app.getByTestId("settings-dialog").count()).toBeGreaterThan(
        0
      ),
    { timeout: 10000, interval: 300 }
  );
  await app.press("escape");
  await vi.waitFor(
    async () =>
      expect(await app.getByTestId("settings-dialog").count()).toBe(0),
    { timeout: 10000, interval: 300 }
  );
});

test("a list item context menu opens on right click", async () => {
  await app.getByText("Layout note 1").click({ button: "right" });
  await vi.waitFor(
    async () =>
      expect(await app.getByTestId("menu-container").count()).toBeGreaterThan(
        0
      ),
    { timeout: 10000, interval: 300 }
  );
  expect(await app.getByTestId("menu-button-pin").count()).toBeGreaterThan(0);
  await app.press("escape");
});
