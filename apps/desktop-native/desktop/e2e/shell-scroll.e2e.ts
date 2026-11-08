import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { listTitles } from "./nav";
import { launchApp, type DesktopApp } from "@react-native-gpui/testing";

const COUNT = 2000;
const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.now();
const seed = Array.from({ length: COUNT }, (_, index) => ({
  title: `Scroll note ${String(index).padStart(4, "0")}`,
  content: `Body of scroll note ${index} with some text to fill the headline`,
  dateEdited: NOW - index * 3 * 60 * 60 * 1000,
  dateCreated: NOW - index * 3 * 60 * 60 * 1000
}));

let app: DesktopApp;

beforeAll(async () => {
  app = await launchApp({
    disableAnimations: true,
    timeout: 240000,
    logFile: process.env.RN_GPUI_E2E_LOG,
    initialProps: { seed, resetConfig: true },
    env: {
      RN_GPUI_APP_DATA_DIR: mkdtempSync(path.join(tmpdir(), "notesnook-e2e-"))
    }
  });
  await vi.waitFor(
    async () => expect(await app.getByTestId("app").count()).toBeGreaterThan(0),
    { timeout: 220000, interval: 1000 }
  );
}, 300000);

afterAll(async () => {
  await app.close();
});

test("a 2,000 note list scrolls and renders the notes it reaches", async () => {
  await vi.waitFor(
    async () => {
      const titles = (await listTitles(app)).map(
        (match: { text?: string }) => match.text
      );
      expect(titles.length).toBeGreaterThan(5);
    },
    { timeout: 60000, interval: 500 }
  );
  const [list] = await app.query("testID", "home-list", true);
  const steps: { step: number; ms: number; drawMs: number; views: number }[] =
    [];
  const visible = async () =>
    (await listTitles(app))
      .map((match: { text?: string }) => match.text ?? "")
      .filter((text: string) => text.startsWith("Scroll note"));
  const firstScreen = await visible();
  for (let step = 0; step < 40; step++) {
    const started = performance.now();
    const result = await app.scroll(list.tag, 0, -300);
    await app.waitForIdle();
    steps.push({
      step,
      ms: +(performance.now() - started).toFixed(1),
      drawMs: +result.drawMs.toFixed(2),
      views: result.renderedViews
    });
  }
  const lastScreen = await visible();
  expect(lastScreen.length).toBeGreaterThan(0);
  expect(lastScreen[0]).not.toBe(firstScreen[0]);
  const ms = steps.map((entry) => entry.ms).sort((a, b) => a - b);
  const summary = {
    notes: COUNT,
    steps: steps.length,
    firstVisible: firstScreen[0],
    lastVisible: lastScreen[0],
    medianMs: ms[Math.floor(ms.length / 2)],
    p90Ms: ms[Math.floor(ms.length * 0.9)],
    maxMs: ms[ms.length - 1],
    drawMedianMs: [...steps].map((e) => e.drawMs).sort((a, b) => a - b)[
      Math.floor(steps.length / 2)
    ],
    drawMaxMs: Math.max(...steps.map((e) => e.drawMs)),
    renderedViewsMedian: [...steps].map((e) => e.views).sort((a, b) => a - b)[
      Math.floor(steps.length / 2)
    ],
    steps
  };
  if (process.env.SCROLL_PERF_OUT)
    writeFileSync(
      process.env.SCROLL_PERF_OUT,
      JSON.stringify(summary, null, 2)
    );
  console.log(
    "SCROLLPERF " + JSON.stringify({ ...summary, stepsMs: undefined })
  );
}, 300000);
