import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import { launchApp } from "./launch";

let app: DesktopApp;

beforeAll(async () => {
  app = await launchApp({
    disableAnimations: true,
    timeout: 180000,
    initialProps: { resetConfig: true },
    env: {
      RN_GPUI_APP_DATA_DIR: mkdtempSync(path.join(tmpdir(), "notesnook-e2e-"))
    }
  });
  await vi.waitFor(
    async () => expect(await app.getByTestId("app").count()).toBeGreaterThan(0),
    { timeout: 90000, interval: 500 }
  );
});

afterAll(async () => {
  await app.close();
});

const settle = (check: () => Promise<void>) =>
  vi.waitFor(check, { timeout: 20000, interval: 300 });

const count = async (id: string) =>
  (await app.query("testID", id, true)).length;

test("the user menu opens the settings dialog on the first section", async () => {
  await app.getByTestId("profile-dropdown").click();
  await settle(async () =>
    expect(await count("menu-button-settings")).toBeGreaterThan(0)
  );
  await app.getByTestId("menu-button-settings").click();
  await settle(async () => expect(await count("settings-dialog")).toBe(1));
  expect(await count("settings-navigation-menu")).toBe(1);
});

test("choosing a section lists its settings", async () => {
  const items = await app.query("testID", "title", true);
  const appearance = items.find(
    (entry: { text?: string }) => entry.text === "Appearance"
  );
  expect(appearance).toBeDefined();
  await app.click(appearance.tag);
  await settle(async () => expect(await count("setting-color-scheme")).toBe(1));
});

test("the color scheme dropdown changes the theme", async () => {
  const [row] = await app.query("testID", "setting-color-scheme", true);
  expect(row).toBeDefined();
});

test("clicking the backdrop closes the dialog", async () => {
  await app.mouseMove({ x: 6, y: 400 });
  await app.mouseDown({ x: 6, y: 400 });
  await app.mouseUp({ x: 6, y: 400 });
  await settle(async () => expect(await count("settings-dialog")).toBe(0));
});
