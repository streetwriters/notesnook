import { PNG } from "pngjs";
import { expect, vi } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import { listTitles, navClick } from "./nav";
import { clickId, count, settle, start, texts } from "./dialogs";

export { clickId, count, settle, texts, navClick, listTitles };

const NOW = Date.now();
const DAY = 24 * 60 * 60 * 1000;

export const viewSeed = [
  {
    title: "Pinned plan",
    content: "A pinned and favorite note",
    pinned: true,
    favorite: true,
    tags: ["urgent"],
    dateEdited: NOW - 1000,
    dateCreated: NOW - 1000
  },
  {
    title: "Grocery list",
    content: "Milk and eggs",
    tags: ["groceries"],
    color: "#f44336",
    dateEdited: NOW - 2 * 60 * 1000,
    dateCreated: NOW - 2 * 60 * 1000
  },
  {
    title: "Travel itinerary",
    content: "Flights and hotels",
    dateEdited: NOW - 3 * DAY,
    dateCreated: NOW - 3 * DAY
  },
  {
    title: "Old archive",
    content: "An archived note",
    archived: true,
    dateEdited: NOW - 40 * DAY,
    dateCreated: NOW - 40 * DAY
  },
  {
    title: "Deleted draft",
    content: "A note in the trash",
    trashed: true,
    dateEdited: NOW - 5 * DAY,
    dateCreated: NOW - 5 * DAY
  }
];

export const viewProps = {
  seed: viewSeed,
  seedNotebooks: [
    { title: "Work", children: [{ title: "Plans" }] },
    { title: "Personal" }
  ],
  seedTags: [{ title: "urgent" }, { title: "groceries" }],
  seedColors: [{ title: "Red", colorCode: "#f44336" }],
  seedReminders: [
    {
      title: "Pay rent",
      mode: "repeat",
      recurringMode: "month",
      selectedDays: [1]
    },
    { title: "Call mom", mode: "once", date: NOW + DAY }
  ]
};

export async function startViews(extra: Record<string, unknown> = {}) {
  const app = await start({ ...viewProps, ...extra });
  await settle(async () =>
    expect((await listTitles(app)).length).toBeGreaterThan(0)
  );
  return app;
}

export async function goTo(app: DesktopApp, route: string) {
  await clickId(app, "tab-home");
  const current = await app.getByTestId("route-title").count();
  const isCurrent =
    current > 0 &&
    (await app.getByTestId("route-title").textContent()) === route;
  if (!isCurrent) await navClick(app, route);
  await settle(async () =>
    expect(await app.getByTestId("route-title").textContent()).toBe(route)
  );
}

export async function openTab(app: DesktopApp, tab: "notebooks" | "tags") {
  await clickId(app, `tab-${tab}`);
  await app.waitForIdle();
}

export async function listTexts(app: DesktopApp) {
  return (await listTitles(app)).map((entry: { text?: string }) => entry.text);
}

export async function expectListed(app: DesktopApp, titles: string[]) {
  await settle(async () => {
    const listed = await listTexts(app);
    for (const title of titles) expect(listed).toContain(title);
  });
}

export async function expectNotListed(app: DesktopApp, titles: string[]) {
  await settle(async () => {
    const listed = await listTexts(app);
    for (const title of titles) expect(listed).not.toContain(title);
  });
}

export async function titleEntry(app: DesktopApp, title: string) {
  let entry: { tag: number; frame: { x: number; y: number } } | undefined;
  await settle(async () => {
    entry = (await listTitles(app)).find(
      (candidate: { text?: string }) => candidate.text === title
    ) as typeof entry;
    expect(entry, `list item ${title}`).toBeDefined();
  });
  return entry as { tag: number; frame: { x: number; y: number } };
}

export async function rightClick(app: DesktopApp, title: string) {
  const entry = await titleEntry(app, title);
  await app.click(entry.tag, { button: "right" });
  await app.waitForIdle();
}

export async function ctrlClick(app: DesktopApp, title: string) {
  const entry = await titleEntry(app, title);
  await app.click(entry.tag, { modifiers: { platform: true } });
}

export async function shiftClick(app: DesktopApp, title: string) {
  const entry = await titleEntry(app, title);
  await app.click(entry.tag, { modifiers: { shift: true } });
}

export async function plainClick(app: DesktopApp, title: string) {
  const entry = await titleEntry(app, title);
  await app.click(entry.tag);
}

export async function expectMenu(app: DesktopApp, keys: string[]) {
  await settle(async () =>
    expect(await count(app, "menu-container")).toBeGreaterThan(0)
  );
  for (const key of keys)
    expect(await count(app, `menu-button-${key}`), key).toBeGreaterThan(0);
}

export async function expectNoMenuItems(app: DesktopApp, keys: string[]) {
  for (const key of keys)
    expect(await count(app, `menu-button-${key}`), key).toBe(0);
}

export async function closeMenu(app: DesktopApp) {
  await app.press("escape");
  await settle(async () => expect(await count(app, "menu-container")).toBe(0));
}

export async function clickMenu(app: DesktopApp, key: string) {
  await clickId(app, `menu-button-${key}`);
  await app.waitForIdle();
}

export async function windowPixel(app: DesktopApp, x: number, y: number) {
  const image = PNG.sync.read(await app.screenshot());
  const size = await app.getWindowSize();
  const scale = image.width / size.width;
  const offset =
    (Math.round(y * scale) * image.width + Math.round(x * scale)) * 4;
  return Array.from(image.data.subarray(offset, offset + 3));
}

export async function rowBackground(app: DesktopApp, title: string) {
  const match = await titleEntry(app, title);
  return windowPixel(app, match.frame.x - 6, match.frame.y + 8);
}

export async function isRowSelected(app: DesktopApp, title: string) {
  await app.mouseMove({ x: 4, y: 4 });
  await app.waitForIdle();
  const selected = await rowBackground(app, title);
  const [plain] = await listTexts(app).then((all) =>
    all.filter((candidate) => candidate && candidate !== title)
  );
  const reference = plain ? await rowBackground(app, plain) : [255, 255, 255];
  return selected.join(",") !== reference.join(",");
}

export async function waitUntil(check: () => Promise<boolean>) {
  await vi.waitFor(async () => expect(await check()).toBe(true), {
    timeout: 20000,
    interval: 300
  });
}

export async function groupHeaderTexts(app: DesktopApp) {
  const headers = await app.query("testID", "group-header", true);
  const titles = await app.query("testID", "title", true);
  return titles
    .filter(
      (entry: {
        frame: { x: number; y: number; width: number; height: number };
      }) =>
        headers.some(
          (header: {
            frame: { x: number; y: number; width: number; height: number };
          }) =>
            entry.frame.x >= header.frame.x &&
            entry.frame.y >= header.frame.y &&
            entry.frame.y + entry.frame.height <=
              header.frame.y + header.frame.height + 0.5
        )
    )
    .map((entry: { text?: string }) => entry.text);
}

export async function resetUi(app: DesktopApp) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const open =
      (await count(app, "menu-container")) +
      (await count(app, "dialog-backdrop"));
    if (open === 0) return;
    await app.press("escape");
    await app.waitForIdle();
  }
}
