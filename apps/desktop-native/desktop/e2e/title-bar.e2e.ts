import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { PNG } from "pngjs";
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

const desktop = path.resolve(__dirname, "..");

test("the window is configured with a hidden system title bar and Electron's traffic light position, and the build embeds them", () => {
  const config = JSON.parse(
    readFileSync(path.join(desktop, "desktop.json"), "utf8")
  );
  expect(config.window.titleBar).toBe("hidden");
  expect(config.window.trafficLightPosition).toEqual({ x: 10, y: 14 });
  const autolink = readFileSync(
    path.join(desktop, "autolink/src/lib.rs"),
    "utf8"
  );
  expect(autolink).toContain('"titleBar":"hidden"');
  expect(autolink).toContain('"trafficLightPosition":{"x":10,"y":14}');
});

test("the app fills the whole window, so no system title bar takes space above it", async () => {
  const [root] = await app.query("testID", "app", true);
  const size = await app.getWindowSize();
  expect(root.frame.y).toBe(0);
  expect(root.frame.height).toBe(size.height);
  expect(root.frame.width).toBe(size.width);
});

test("the action bar is the 45 px top row with the traffic lights inset to its left", async () => {
  const [toggle] = await app.query("testID", "sidebar-toggle", true);
  expect(toggle.frame.x).toBeGreaterThanOrEqual(78);
  expect(toggle.frame.y).toBeGreaterThanOrEqual(0);
  expect(toggle.frame.y + toggle.frame.height).toBeLessThanOrEqual(45);

  const image = PNG.sync.read(await app.screenshot());
  const scale = image.width / (await app.getWindowSize()).width;
  const pixel = (x: number, y: number) => {
    const offset =
      (Math.round(y * scale) * image.width + Math.round(x * scale)) * 4;
    return Array.from(image.data.subarray(offset, offset + 3));
  };
  const barRow = pixel(600, 22);
  const below = pixel(600, 60);
  expect(barRow).toEqual([247, 247, 247]);
  expect(pixel(600, 3)).toEqual(barRow);
  expect(below.every((channel) => channel > 200)).toBe(true);
});
