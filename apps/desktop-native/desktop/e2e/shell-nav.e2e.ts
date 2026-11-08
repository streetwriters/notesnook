import { PNG } from "pngjs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { launchApp, type DesktopApp } from "@react-native-gpui/testing";

const NOW = Date.now();
const seed = [1, 2, 3, 4].map((n) => ({
  title: `Keyed note ${n}`,
  content: `Body of keyed note ${n}`,
  dateEdited: NOW - n * 60 * 1000,
  dateCreated: NOW - n * 60 * 1000
}));

let app: DesktopApp;

beforeAll(async () => {
  app = await launchApp({
    disableAnimations: false,
    timeout: 180000,
    logFile: process.env.RN_GPUI_E2E_LOG,
    initialProps: {
      seed,
      resetConfig: true,
      seedNotebooks: [{ title: "Work" }, { title: "Home" }],
      seedTags: [{ title: "urgent" }],
      seedColors: [{ title: "Red", colorCode: "#f44336" }]
    },
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

const visible = async (id: string) =>
  (await app.query("testID", id, true)).length > 0;

test("the home tab lists the routes and colours", async () => {
  await vi.waitFor(async () => expect(await visible("nav-notes")).toBe(true), {
    timeout: 20000,
    interval: 300
  });
  await vi.waitFor(
    async () => expect(await visible("nav-color-Red")).toBe(true),
    { timeout: 20000, interval: 300 }
  );
  expect(await visible("create-note-button")).toBe(true);
  expect(await visible("nav-app-name")).toBe(true);
});

test("the notebooks and tags tabs list their items and navigate", async () => {
  await app.getByTestId("tab-notebooks").click();
  await vi.waitFor(
    async () => {
      expect(await visible("notebook-Work")).toBe(true);
      expect(await visible("notebook-Home")).toBe(true);
    },
    { timeout: 20000, interval: 300 }
  );
  await app.getByTestId("notebook-Work").click();
  await vi.waitFor(
    async () =>
      expect(await app.getByTestId("route-title").textContent()).toBe("Work"),
    { timeout: 20000, interval: 300 }
  );
  await vi.waitFor(
    async () => expect(await visible("notebook-header")).toBe(true),
    {
      timeout: 10000,
      interval: 300
    }
  );

  await app.getByTestId("tab-tags").click();
  await vi.waitFor(async () => expect(await visible("tag-urgent")).toBe(true), {
    timeout: 20000,
    interval: 300
  });
  await app.getByTestId("tag-urgent").click();
  await vi.waitFor(
    async () =>
      expect(await app.getByTestId("route-title").textContent()).toBe(
        "#urgent"
      ),
    { timeout: 20000, interval: 300 }
  );

  await app.getByTestId("tab-home").click();
  await app.getByTestId("nav-notes").click();
  await vi.waitFor(
    async () =>
      expect(await app.getByTestId("route-title").textContent()).toBe("Notes"),
    { timeout: 20000, interval: 300 }
  );
});

async function windowPixel(x: number, y: number) {
  const image = PNG.sync.read(await app.screenshot());
  const size = await app.getWindowSize();
  const scale = image.width / size.width;
  const offset =
    (Math.round(y * scale) * image.width + Math.round(x * scale)) * 4;
  return Array.from(image.data.subarray(offset, offset + 3));
}

async function rowBackground(title: string) {
  const match = (await app.query("testID", "title", true)).find(
    (entry: { text?: string }) => entry.text === title
  );
  expect(match, title).toBeDefined();
  return windowPixel(match.frame.x - 6, match.frame.y + match.frame.height / 2);
}

test("arrow keys move the selection through the list", async () => {
  await vi.waitFor(
    async () =>
      expect(
        (
          await app.query("testID", "title", true)
        ).some((m: { text?: string }) => m.text === "Keyed note 1")
      ).toBe(true),
    { timeout: 20000, interval: 300 }
  );
  await app.getByText("Keyed note 2").click();
  await app.mouseMove({ x: 4, y: 4 });
  await app.waitForIdle();
  await app.press("down");
  await app.mouseMove({ x: 4, y: 4 });
  await app.waitForIdle();
  await vi.waitFor(
    async () => {
      const second = await rowBackground("Keyed note 3");
      expect(second, `row below ${second}`).toEqual([247, 247, 247]);
    },
    { timeout: 10000, interval: 300 }
  );
});

test("a modifier click selects several notes", async () => {
  await app.press("escape");
  await app.waitForIdle();
  await app.getByText("Keyed note 3").click({ modifiers: { platform: true } });
  await app.getByText("Keyed note 4").click({ modifiers: { platform: true } });
  await app.mouseMove({ x: 4, y: 4 });
  await app.waitForIdle();
  await vi.waitFor(
    async () => {
      expect(await rowBackground("Keyed note 3")).toEqual([247, 247, 247]);
      expect(await rowBackground("Keyed note 4")).toEqual([247, 247, 247]);
    },
    { timeout: 10000, interval: 300 }
  );
});
