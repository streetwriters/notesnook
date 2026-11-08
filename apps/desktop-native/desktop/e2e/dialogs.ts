import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, vi } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import { launchApp } from "./launch";

const NOW = Date.now();

export const seedNotes = [
  { title: "Apple pie", content: "Bake the apple pie slowly" },
  { title: "Garden", content: "Water the plants" },
  { title: "Travel", content: "Pack the bags" }
].map((note, index) => ({
  ...note,
  dateEdited: NOW - index * 60000,
  dateCreated: NOW - index * 60000
}));

export async function start(
  initialProps: Record<string, unknown> = {}
): Promise<DesktopApp> {
  const app = await launchApp({
    disableAnimations: true,
    timeout: 180000,
    initialProps: { resetConfig: true, ...initialProps },
    env: {
      RN_GPUI_APP_DATA_DIR: mkdtempSync(path.join(tmpdir(), "notesnook-e2e-"))
    }
  });
  await vi.waitFor(
    async () => expect(await app.getByTestId("app").count()).toBeGreaterThan(0),
    { timeout: 90000, interval: 500 }
  );
  return app;
}

export const settle = (check: () => Promise<void>) =>
  vi.waitFor(check, { timeout: 20000, interval: 300 });

export const count = async (app: DesktopApp, id: string) =>
  (await app.query("testID", id, true)).length;

export async function clickId(app: DesktopApp, id: string, nth = 0) {
  await settle(async () => expect(await count(app, id)).toBeGreaterThan(nth));
  const matches = await app.query("testID", id, true);
  matches.sort(
    (
      a: { frame: { y: number; x: number } },
      b: { frame: { y: number; x: number } }
    ) => a.frame.y - b.frame.y || a.frame.x - b.frame.x
  );
  await app.click(matches[nth].tag);
}

export async function typeInto(app: DesktopApp, id: string, text: string) {
  await settle(async () => expect(await count(app, id)).toBeGreaterThan(0));
  const [field] = await app.query("testID", id, true);
  await app.click(field.tag);
  await app.typeText(field.tag, text);
}

export async function texts(app: DesktopApp, id = "title") {
  return (await app.query("testID", id, true)).map(
    (entry: { text?: string }) => entry.text
  );
}

export async function clickTitle(app: DesktopApp, title: string) {
  await settle(async () => expect(await texts(app)).toContain(title));
  const entry = (await app.query("testID", "title", true)).find(
    (candidate: { text?: string }) => candidate.text === title
  );
  if (!entry) throw new Error("title not found");
  await app.click(entry.tag);
}

export async function expectDialog(
  app: DesktopApp,
  testID: string,
  title?: string
) {
  await settle(async () => expect(await count(app, testID)).toBe(1));
  if (title)
    await settle(async () =>
      expect(await texts(app, "dialog-title")).toContain(title)
    );
}

export async function expectClosed(app: DesktopApp, testID: string) {
  await settle(async () => expect(await count(app, testID)).toBe(0));
}

export async function closeWithEscape(app: DesktopApp, testID: string) {
  await app.press("escape");
  await expectClosed(app, testID);
}

export async function closeWithBackdrop(app: DesktopApp, testID: string) {
  const backdrop = `${testID}-backdrop`;
  const id = (await count(app, backdrop)) > 0 ? backdrop : "dialog-backdrop";
  await app.mouseMove({ x: 6, y: 400 });
  await app.mouseDown({ x: 6, y: 400 });
  await app.mouseUp({ x: 6, y: 400 });
  await expectClosed(app, testID);
  return id;
}

export async function openCommandPalette(app: DesktopApp) {
  await clickId(app, "command-palette");
  await settle(async () => expect(await count(app, "dialog")).toBe(1));
}

export async function openSettings(app: DesktopApp) {
  await clickId(app, "profile-dropdown");
  await clickId(app, "menu-button-settings");
  await expectDialog(app, "settings-dialog");
}

export async function chooseSection(app: DesktopApp, title: string) {
  await settle(async () => {
    const entries = await app.query("testID", "title", true);
    expect(
      entries.some((entry: { text?: string }) => entry.text === title)
    ).toBe(true);
  });
  const entry = (await app.query("testID", "title", true)).find(
    (candidate: { text?: string }) => candidate.text === title
  );
  if (!entry) throw new Error("title not found");
  await app.click(entry.tag);
}

export async function expectSettings(app: DesktopApp, keys: string[]) {
  for (const key of keys)
    await settle(async () =>
      expect(await count(app, `setting-${key}`)).toBeGreaterThan(0)
    );
}
