import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, vi } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import { launchApp, waitForShellContent } from "./launch";

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
  initialProps: Record<string, unknown> = {},
  waitForShell = true
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
  if (waitForShell) await waitForShellContent(app);
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

type TreeNode = {
  testID?: string;
  text?: string;
  children?: TreeNode[];
};

/** The texts drawn inside each element with this test id, in tree order. */
export async function textsUnder(app: DesktopApp, id: string) {
  const found: string[][] = [];
  const collect = (node: TreeNode, into: string[]) => {
    if (node.text) into.push(node.text);
    for (const child of node.children ?? []) collect(child, into);
  };
  const walk = (node: TreeNode) => {
    if (node.testID === id) {
      const texts: string[] = [];
      collect(node, texts);
      found.push(texts);
    }
    for (const child of node.children ?? []) walk(child);
  };
  walk((await app.tree()) as TreeNode);
  return found;
}

/** The title of the open route: the first text of the route header. */
export async function routeTitle(app: DesktopApp) {
  return (await textsUnder(app, "routeHeader"))[0]?.[0];
}

/** The item counts the navigation items show. */
export async function itemCounts(app: DesktopApp) {
  return (await textsUnder(app, "navigation-item")).flatMap((texts) =>
    texts.filter((text) => /^\d+$/.test(text))
  );
}

type Framed = {
  tag: number;
  frame: { x: number; y: number; width: number; height: number };
};

/**
 * Clicks the route's own button (new reminder, clear trash…): the first of the
 * buttons on the right of the route header's title row.
 */
export async function clickRouteButton(app: DesktopApp) {
  const [header]: Framed[] = await app.query("testID", "routeHeader", true);
  expect(header, "routeHeader").toBeDefined();
  const buttons: Framed[] = (await app.query("role", "button", true)).filter(
    (button: Framed) =>
      button.frame.y >= header.frame.y &&
      button.frame.y < header.frame.y + 50 &&
      button.frame.x > header.frame.x + header.frame.width / 2 &&
      button.frame.x < header.frame.x + header.frame.width
  );
  buttons.sort((a, b) => a.frame.x - b.frame.x);
  expect(buttons.length, "route header buttons").toBeGreaterThan(0);
  await app.click(buttons[0].tag);
}

/** Clicks the nth button (left to right) inside the element with this id. */
export async function clickButtonIn(app: DesktopApp, id: string, nth = 0) {
  const [container]: Framed[] = await app.query("testID", id, true);
  expect(container, id).toBeDefined();
  const buttons: Framed[] = (await app.query("role", "button", true)).filter(
    (button: Framed) =>
      button.frame.x >= container.frame.x &&
      button.frame.y >= container.frame.y &&
      button.frame.x + button.frame.width <=
        container.frame.x + container.frame.width + 0.5 &&
      button.frame.y + button.frame.height <=
        container.frame.y + container.frame.height + 0.5
  );
  buttons.sort((a, b) => a.frame.x - b.frame.x);
  expect(buttons.length, `buttons in ${id}`).toBeGreaterThan(nth);
  await app.click(buttons[nth].tag);
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
  const find = async () =>
    (await app.query("testID", "title", true)).find(
      (candidate: { text?: string }) => candidate.text === title
    );
  await settle(async () => expect(await find()).toBeDefined());
  for (let attempt = 0; attempt < 12; attempt++) {
    const entry = await find();
    const [menu] = await app.query("testID", "settings-navigation-menu", true);
    if (!entry) throw new Error("title not found");
    const bottom = menu.frame.y + menu.frame.height;
    const top = menu.frame.y;
    const entryBottom = entry.frame.y + entry.frame.height;
    if (entry.frame.y >= top && entryBottom <= bottom) {
      await app.click(entry.tag);
      return;
    }
    const dy =
      entry.frame.y < top
        ? entry.frame.y - top - 40
        : entryBottom - bottom + 40;
    await app.scroll(menu.tag, 0, -dy);
    await app.waitForIdle();
  }
  throw new Error(`could not scroll "${title}" into view`);
}

export async function expectSettings(app: DesktopApp, keys: string[]) {
  for (const key of keys)
    await settle(async () =>
      expect(await count(app, `setting-${key}`)).toBeGreaterThan(0)
    );
}
