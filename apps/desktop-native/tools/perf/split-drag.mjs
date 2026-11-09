import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(here, "../..");
const require = createRequire(path.join(appDir, "package.json"));
const { launchApp } = await import(
  require.resolve("@react-native-gpui/testing")
);

const label = process.argv[2] ?? "run";
const outFile = process.argv[3];
const steps = Number(process.env.STEPS ?? 60);
const distance = Number(process.env.DISTANCE ?? 200);

process.env.RN_GPUI_TEST_PROJECT = appDir;
process.env.RN_GPUI_TEST_BUNDLE ??= path.join(appDir, "desktop/build/index.bundle");
process.env.RN_GPUI_TEST_BINARY ??= path.join(
  appDir,
  "desktop/build/target/debug/react-native-gpui--notesnook-desktop-native"
);

const app = await launchApp({
  logFile: process.env.SPLIT_LOG,
  disableAnimations: true,
  timeout: 120000,
  initialProps: {
    resetConfig: true,
    seed: Array.from({ length: Number(process.env.NOTES ?? 500) }, (_, i) => ({
      title: `Note ${i + 1}`,
      content: `Body of note ${i + 1} with some text to wrap across the list row`,
      dateEdited: Date.now() - i * 60000,
      dateCreated: Date.now() - i * 60000
    }))
  },
  env: {
    RN_GPUI_APP_DATA_DIR: fs.mkdtempSync(path.join(os.tmpdir(), "split-drag-")),
    RN_GPUI_TEST_DISPLAY: process.env.RN_GPUI_TEST_DISPLAY ?? "retina"
  }
});

const killApp = () => {
  try {
    if (app.pid) process.kill(app.pid, "SIGKILL");
  } catch {}
};
process.on("exit", killApp);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    killApp();
    process.exit(1);
  });

try {
  await app.setWindowSize(1200, 800);
  for (let i = 0; i < 100; i++) {
    if ((await app.getByTestId("app").count()) > 0) break;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  await app.waitForIdle();
  const [sash] = await app.query("testID", "global-split-pane-sash-0", true);
  const { x, y, width, height } = sash.frame;
  const start = { x: x + width / 2, y: y + height / 2 };
  const results = [];
  for (const direction of (process.env.DIRECTIONS ?? "1,-1").split(",").map(Number)) {
    await app.mouseMove(start);
    await app.mouseDown(start);
    await app.layoutStats({ reset: true });
    const times = [];
    for (let i = 1; i <= steps; i++) {
      const position = {
        x: start.x + (direction * distance * i) / steps,
        y: start.y
      };
      const t0 = performance.now();
      await app.mouseMove(position);
      times.push(performance.now() - t0);
      const pace = Number(process.env.PACE_MS ?? 0);
      if (pace) await new Promise((resolve) => setTimeout(resolve, pace));
    }
    const endMove = performance.now();
    await app.mouseUp({ x: start.x + direction * distance, y: start.y });
    await app.waitForIdle();
    const drainMs = performance.now() - endMove;
    const stats = await app.layoutStats({ reset: true });
    times.sort((a, b) => a - b);
    const pick = (q) => times[Math.min(times.length - 1, Math.floor(q * times.length))];
    results.push({
      direction,
      steps,
      drainMs,
      requestMs: { median: pick(0.5), p95: pick(0.95), max: times[times.length - 1] },
      stats
    });
    start.x += direction * distance;
  }
  const report = { label, steps, distance, results };
  if (outFile) fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await app.close();
}
