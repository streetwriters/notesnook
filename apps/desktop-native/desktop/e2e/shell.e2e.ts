import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { launchApp, type DesktopApp } from "@react-native-gpui/testing";

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
  const matches = await app.query("testID", "title", true);
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
