import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterAll, afterEach, expect, vi } from "vitest";
import {
  launchApp as launch,
  type DesktopApp
} from "@react-native-gpui/testing";

type Options = Parameters<typeof launch>[0];

const failures = path.resolve(__dirname, "../build/e2e-failures");
const pidDir = path.resolve(__dirname, "../build/e2e-pids");
const pidFile = (app: DesktopApp) =>
  path.join(
    pidDir,
    `${process.env.RN_GPUI_E2E_RUN ?? process.ppid}-${app.pid}`
  );
const running = new Set<DesktopApp>();

function killAll() {
  for (const app of running) {
    try {
      if (app.pid) process.kill(app.pid, "SIGKILL");
    } catch {}
    rmSync(pidFile(app), { force: true });
  }
}

process.on("exit", killAll);
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    killAll();
    process.exit(1);
  });

afterAll(async () => {
  await Promise.all([...running].map((app) => app.close().catch(() => {})));
  killAll();
  running.clear();
});
let counter = 0;

const slug = (value: string) => value.replace(/[^a-z0-9]+/gi, "-").slice(0, 80);

export async function launchApp(options: Options): Promise<DesktopApp> {
  mkdirSync(failures, { recursive: true });
  const file = slug(expect.getState().testPath?.split("/").pop() ?? "e2e");
  const logFile =
    options.logFile ??
    process.env.RN_GPUI_E2E_LOG ??
    path.join(failures, `${file}.${process.pid}.${++counter}.log`);
  const app = await launch({ ...options, logFile });
  app.allowErrors(/ERR_UPDATER|the feed answered/u);
  running.add(app);
  mkdirSync(pidDir, { recursive: true });
  writeFileSync(pidFile(app), "");
  return app;
}

afterEach(async (context) => {
  if (context.task.result?.state !== "fail") return;
  const name = slug(context.task.name);
  for (const app of running) {
    try {
      writeFileSync(
        path.join(failures, `${name}.${process.pid}.png`),
        await app.screenshot()
      );
    } catch {}
  }
});

export async function waitForShellContent(app: DesktopApp) {
  await vi.waitFor(
    async () =>
      expect(
        (
          await app.query("testID", "navigation-item", true)
        ).length
      ).toBeGreaterThan(0),
    { timeout: 60000, interval: 300 }
  );
}
