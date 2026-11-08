import { PNG } from "pngjs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { launchApp, type DesktopApp } from "@react-native-gpui/testing";
import { navClick, navVisible, listTitles } from "./nav";

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
  await vi.waitFor(
    async () => expect(await navVisible(app, "Notes")).toBe(true),
    {
      timeout: 20000,
      interval: 300
    }
  );
  await vi.waitFor(
    async () => expect(await navVisible(app, "Red")).toBe(true),
    { timeout: 20000, interval: 300 }
  );
  expect(await visible("create-note-button")).toBe(true);
  expect(await app.getByText("Notesnook").count()).toBeGreaterThan(0);
});

test("the notebooks and tags tabs list their items and navigate", async () => {
  await app.getByTestId("tab-notebooks").click();
  await vi.waitFor(
    async () => {
      expect(await navVisible(app, "Work")).toBe(true);
      expect(await navVisible(app, "Home")).toBe(true);
    },
    { timeout: 20000, interval: 300 }
  );
  await navClick(app, "Work");
  await vi.waitFor(
    async () =>
      expect(await app.getByTestId("notebook-title").textContent()).toBe(
        "Work"
      ),
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
  await vi.waitFor(
    async () => expect(await navVisible(app, "urgent")).toBe(true),
    {
      timeout: 20000,
      interval: 300
    }
  );
  await navClick(app, "urgent");
  await vi.waitFor(
    async () =>
      expect(await app.getByTestId("route-title").textContent()).toBe(
        "#urgent"
      ),
    { timeout: 20000, interval: 300 }
  );

  await app.getByTestId("tab-home").click();
  await navClick(app, "Notes");
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
  const match = (await listTitles(app)).find(
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
          await listTitles(app)
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

test("the view mode button switches the list between detailed and compact rows", async () => {
  await app.press("escape");
  await app.waitForIdle();
  const height = async () => {
    const [row] = await app.query("testID", "list-item", true);
    return row.frame.height;
  };
  const detailed = await height();
  await app.getByTestId("home-view-mode-button").click();
  await vi.waitFor(
    async () => expect(await height()).toBeLessThan(detailed - 40),
    {
      timeout: 10000,
      interval: 300
    }
  );
  await app.getByTestId("home-view-mode-button").click();
  await vi.waitFor(
    async () => expect(await height()).toBeGreaterThan(detailed - 5),
    {
      timeout: 10000,
      interval: 300
    }
  );
});
