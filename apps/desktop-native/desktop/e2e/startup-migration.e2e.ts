import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, test, vi } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import { launchApp, waitForShellContent } from "./launch";

const dataDir = mkdtempSync(path.join(tmpdir(), "notesnook-e2e-migration-"));
const logOf = (label: string) => path.join(dataDir, `${label}.log`);
const migrations = (label: string) =>
  readFileSync(logOf(label), "utf8")
    .split("\n")
    .filter((line) => line.includes("migration started"));

const overlays = (label: string) =>
  readFileSync(logOf(label), "utf8")
    .split("\n")
    .filter((line) => line.includes("migration overlay shown"));

async function launch(
  label: string,
  initialProps: Record<string, unknown> = {}
) {
  const app = await launchApp({
    disableAnimations: true,
    timeout: 180000,
    initialProps,
    env: { RN_GPUI_APP_DATA_DIR: dataDir },
    logFile: logOf(label)
  });
  await waitForShellContent(app);
  return app;
}

async function watchForOverlay(app: DesktopApp, milliseconds: number) {
  const until = Date.now() + milliseconds;
  while (Date.now() < until) {
    expect(
      await app.getByText("Migrating database", { exact: false }).count()
    ).toBe(0);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

describe("the migrating database overlay", () => {
  test("a new profile creates its database without showing the overlay", async () => {
    const app = await launch("first");
    await watchForOverlay(app, 3000);
    expect(migrations("first")).toEqual([]);
    await app.close();
    expect(overlays("first")).toEqual([]);
  });

  test("the second launch of the same profile never shows it", async () => {
    const app = await launch("second");
    await watchForOverlay(app, 3000);
    expect(migrations("second")).toEqual([]);
    await app.close();
    expect(overlays("second")).toEqual([]);
  });

  test("a JS reload never shows it either", async () => {
    const app = await launch("reload");
    for (let index = 0; index < 2; index++) {
      await app.reload();
      await waitForShellContent(app);
      await watchForOverlay(app, 2000);
    }
    expect(migrations("reload")).toEqual([]);
    await app.close();
  });

  test("a migration that lasts longer than 300 ms shows it", async () => {
    const app = await launch("slow", { simulateMigrationMs: 2000 });
    await app.close();
    expect(overlays("slow").length).toBe(1);
  });

  test("a migration shorter than 300 ms never shows it", async () => {
    const app = await launch("quick", { simulateMigrationMs: 100 });
    await watchForOverlay(app, 2000);
    await app.close();
    expect(overlays("quick")).toEqual([]);
  });
});
