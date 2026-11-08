import type { DesktopApp } from "@react-native-gpui/testing";

const NAV_WIDTH = 250;

async function find(app: DesktopApp, title: string) {
  const titles = await app.query("testID", "title", true);
  return titles.find(
    (entry: { text?: string; frame: { x: number } }) =>
      entry.text === title && entry.frame.x < NAV_WIDTH
  );
}

export async function navVisible(app: DesktopApp, title: string) {
  return (await find(app, title)) !== undefined;
}

export async function navClick(app: DesktopApp, title: string) {
  const match = await find(app, title);
  if (!match) throw new Error(`no navigation item "${title}"`);
  await app.click(match.tag);
}

type Frame = { x: number; y: number; width: number; height: number };
type Entry = { text?: string; frame: Frame };

const inside = (inner: Frame, outer: Frame) =>
  inner.x >= outer.x &&
  inner.y >= outer.y &&
  inner.x + inner.width <= outer.x + outer.width + 0.5 &&
  inner.y + inner.height <= outer.y + outer.height + 0.5;

async function listPaneTitles(app: DesktopApp) {
  const titles: Entry[] = await app.query("testID", "title", true);
  const headers: Entry[] = await app.query("testID", "group-header", true);
  return { titles: titles.filter((t) => t.frame.x >= NAV_WIDTH), headers };
}

export async function listTitles(app: DesktopApp) {
  const { titles, headers } = await listPaneTitles(app);
  return titles.filter((t) => !headers.some((h) => inside(t.frame, h.frame)));
}

export async function groupHeaderTitles(app: DesktopApp) {
  const { titles, headers } = await listPaneTitles(app);
  return titles.filter((t) => headers.some((h) => inside(t.frame, h.frame)));
}
