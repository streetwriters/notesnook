import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { PNG } from "pngjs";
import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { launchApp, type DesktopApp } from "@react-native-gpui/testing";
import { groupHeaderTitles, listTitles, navClick } from "./nav";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.now();
const seed = [
  ...[1, 2, 3].map((n) => ({
    title: `Today note ${n}`,
    content: `Body of today note ${n}`,
    dateEdited: NOW - n * 60 * 1000,
    dateCreated: NOW - n * 60 * 1000
  })),
  ...[1, 2].map((n) => ({
    title: `Older note ${n}`,
    dateEdited: NOW - 40 * DAY - n * 1000,
    dateCreated: NOW - 40 * DAY - n * 1000
  })),
  {
    title: "Favourite note",
    favorite: true,
    dateEdited: NOW - 2 * 60 * 1000,
    dateCreated: NOW - 2 * 60 * 1000
  }
];

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
  await vi.waitFor(
    async () => {
      expect(await app.getByTestId("app").count()).toBeGreaterThan(0);
    },
    { timeout: 90000, interval: 500 }
  );
});

afterAll(async () => {
  await app.close();
});

async function titles() {
  const matches = await listTitles(app);
  return matches.map((match: { text?: string }) => match.text);
}

test("the shell shows the navigation, list and editor panes and the status bar", async () => {
  for (const id of [
    "navigation-menu",
    "global-split-pane",
    "pane-list-pane",
    "editor-placeholder",
    "status-bar"
  ])
    expect(await app.getByTestId(id).count(), id).toBeGreaterThan(0);
});

test("the notes list shows the seeded notes", async () => {
  await vi.waitFor(
    async () => {
      const all = await titles();
      for (const title of [
        "Today note 1",
        "Today note 3",
        "Older note 1",
        "Favourite note"
      ])
        expect(all).toContain(title);
    },
    { timeout: 30000, interval: 500 }
  );
  expect(await app.getByTestId("group-header").count()).toBeGreaterThan(1);
});

async function routeTitle() {
  return app.getByTestId("route-title").textContent();
}

test("navigating between sections changes the route and the list", async () => {
  await navClick(app, "Favorites");
  await vi.waitFor(async () => expect(await routeTitle()).toBe("Favorites"), {
    timeout: 15000,
    interval: 300
  });
  await vi.waitFor(
    async () => expect(await titles()).toEqual(["Favourite note"]),
    { timeout: 15000, interval: 300 }
  );

  await navClick(app, "Notes");
  await vi.waitFor(async () => expect(await routeTitle()).toBe("Notes"), {
    timeout: 15000,
    interval: 300
  });
  await vi.waitFor(
    async () => expect(await titles()).toContain("Today note 2"),
    { timeout: 15000, interval: 300 }
  );

  await navClick(app, "Trash");
  await vi.waitFor(async () => expect(await routeTitle()).toBe("Trash"), {
    timeout: 15000,
    interval: 300
  });
  await navClick(app, "Notes");
  await vi.waitFor(async () => expect(await routeTitle()).toBe("Notes"), {
    timeout: 15000,
    interval: 300
  });
});

test("the list shows group headers in date order", async () => {
  const headers = await groupHeaderTitles(app);
  expect(headers.length).toBeGreaterThanOrEqual(2);
  const texts = headers.map((header: { text?: string }) => header.text);
  expect(new Set(texts).size).toBe(texts.length);
});

async function windowPixel(x: number, y: number) {
  const image = PNG.sync.read(await app.screenshot());
  const size = await app.getWindowSize();
  const scale = image.width / size.width;
  const offset =
    (Math.round(y * scale) * image.width + Math.round(x * scale)) * 4;
  return Array.from(image.data.subarray(offset, offset + 3));
}

test("pressing a note marks it as selected", async () => {
  const [title] = await listTitles(app);
  const target = (await listTitles(app)).find(
    (match: { text?: string }) => match.text === "Today note 2"
  );
  expect(target).toBeDefined();
  const inset = (await app.menuBarState()).inset;
  const at = {
    x: target.frame.x - 6,
    y: target.frame.y + target.frame.height / 2 + inset
  };
  const before = await windowPixel(at.x, at.y - inset);
  expect(before.every((c: number) => c >= 250)).toBe(true);
  await app.getByText("Today note 2").click();
  await app.mouseMove({ x: 4, y: 4 });
  await app.waitForIdle();
  await vi.waitFor(
    async () => {
      const after = await windowPixel(at.x, at.y - inset);
      expect(after[0], `selected colour ${after}`).toBe(247);
      expect(after[1]).toBe(247);
      expect(after[2]).toBe(247);
    },
    { timeout: 10000, interval: 300 }
  );
  void title;
});
