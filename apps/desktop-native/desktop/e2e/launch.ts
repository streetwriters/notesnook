import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, expect } from "vitest";
import {
  launchApp as launch,
  type DesktopApp
} from "@react-native-gpui/testing";

type Options = Parameters<typeof launch>[0];

const failures = path.resolve(__dirname, "../build/e2e-failures");
const running = new Set<DesktopApp>();
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
  running.add(app);
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
