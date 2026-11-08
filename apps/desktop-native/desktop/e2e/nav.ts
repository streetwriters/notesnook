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

export async function listTitles(app: DesktopApp) {
  const titles = await app.query("testID", "title", true);
  return titles.filter(
    (entry: { frame: { x: number } }) => entry.frame.x >= NAV_WIDTH
  );
}
