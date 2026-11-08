import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test, vi } from "vitest";
import { launchApp, type DesktopApp } from "@react-native-gpui/testing";

const dataDir = mkdtempSync(path.join(tmpdir(), "notesnook-e2e-"));

let launches = 0;
async function launch(initialProps: Record<string, unknown>) {
  const app = await launchApp({
    disableAnimations: true,
    timeout: 180000,
    logFile: process.env.RN_GPUI_E2E_LOG
      ? `${process.env.RN_GPUI_E2E_LOG}.${++launches}`
      : undefined,
    initialProps,
    env: { RN_GPUI_APP_DATA_DIR: dataDir }
  });
  await vi.waitFor(
    async () => expect(await app.getByTestId("app").count()).toBeGreaterThan(0),
    { timeout: 90000, interval: 500 }
  );
  return app;
}

async function layoutKey(app: DesktopApp) {
  const frames = await Promise.all(
    ["pane-nav-pane", "global-split-pane-sash-0", "pane-list-pane"].map(
      async (id) => (await app.query("testID", id, true))[0]?.frame
    )
  );
  return JSON.stringify(frames);
}

async function settled(app: DesktopApp) {
  let previous = "";
  await vi.waitFor(
    async () => {
      await app.waitForIdle();
      const current = await layoutKey(app);
      const stable = current === previous && !current.includes("null");
      previous = current;
      expect(stable).toBe(true);
    },
    { timeout: 20000, interval: 200 }
  );
}

async function width(app: DesktopApp, testID: string) {
  const [node] = await app.query("testID", testID, true);
  return node.frame.width as number;
}

test("a resized split pane keeps its size across a restart", async () => {
  const first = await launch({
    resetConfig: true,
    seed: [{ title: "Persisted note" }]
  });
  try {
    await settled(first);
    expect(await width(first, "pane-nav-pane")).toBeCloseTo(250, 0);
    const [sash] = await first.query(
      "testID",
      "global-split-pane-sash-0",
      true
    );
    const [listPane] = await first.query("testID", "pane-list-pane", true);
    await first.drag(sash.tag, listPane.tag, { steps: 8 });
    await first.waitForIdle();
    await vi.waitFor(
      async () =>
        expect(await width(first, "pane-nav-pane")).toBeGreaterThan(300),
      { timeout: 10000, interval: 300 }
    );
  } finally {
    await first.close();
  }
  const resized = 250;
  const second = await launch({});
  try {
    const restored = await width(second, "pane-nav-pane");
    expect(restored).toBeGreaterThan(resized + 60);
  } finally {
    await second.close();
  }
}, 240000);
