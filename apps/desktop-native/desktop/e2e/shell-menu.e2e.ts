import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { PNG } from "pngjs";
import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import { launchApp, waitForShellContent } from "./launch";

let app: DesktopApp;

beforeAll(async () => {
  app = await launchApp({
    disableAnimations: true,
    timeout: 180000,
    initialProps: { seed: [{ title: "A note" }], resetConfig: true },
    env: {
      RN_GPUI_APP_DATA_DIR: mkdtempSync(path.join(tmpdir(), "notesnook-e2e-"))
    }
  });
  await vi.waitFor(
    async () => expect(await app.getByTestId("app").count()).toBeGreaterThan(0),
    { timeout: 90000, interval: 500 }
  );
  await waitForShellContent(app);
});

afterAll(async () => {
  await app.close();
});

async function pixel(x: number, y: number) {
  const image = PNG.sync.read(await app.screenshot());
  const size = await app.getWindowSize();
  const scale = image.width / size.width;
  const offset =
    (Math.round(y * scale) * image.width + Math.round(x * scale)) * 4;
  return Array.from(image.data.subarray(offset, offset + 3));
}

test("the profile button opens the user menu with web's items", async () => {
  expect(await app.getByTestId("menu-container").count()).toBe(0);
  await app.getByTestId("profile-dropdown").click();
  await app.waitForIdle();
  expect(await app.getByTestId("menu-container").count()).toBe(1);
  for (const key of [
    "toggle-theme-mode",
    "settings",
    "help-and-support",
    "login"
  ])
    expect(await app.getByTestId(`menu-button-${key}`).count(), key).toBe(1);
  expect(await app.getByTestId("menu-button-logout").count()).toBe(0);
});

test("the dark mode item switches the theme and a click outside closes the menu", async () => {
  expect((await pixel(600, 600))[0]).toBeGreaterThan(240);
  await app.getByTestId("menu-button-toggle-theme-mode").click();
  await app.waitForIdle();
  expect(await app.getByTestId("menu-container").count()).toBe(0);
  await vi.waitFor(
    async () => expect((await pixel(600, 600))[0]).toBeLessThan(60),
    {
      timeout: 10000,
      interval: 300
    }
  );
  await app.getByTestId("profile-dropdown").click();
  await app.waitForIdle();
  expect(await app.getByTestId("menu-container").count()).toBe(1);
  await app.click((await app.query("testID", "menu-backdrop", true))[0].tag);
  await app.waitForIdle();
  expect(await app.getByTestId("menu-container").count()).toBe(0);
});
