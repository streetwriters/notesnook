import { afterAll, beforeAll, describe, expect, test, afterEach } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import {
  clickId,
  count,
  goTo,
  isRowSelected,
  listTexts,
  plainClick,
  settle,
  startViews,
  waitUntil,
  resetUi
} from "./views";

let app: DesktopApp;

beforeAll(async () => {
  app = await startViews();
  await goTo(app, "Notes");
  await plainClick(app, "Grocery list");
});

afterAll(async () => {
  await app.close();
});

afterEach(async () => {
  await resetUi(app);
});

describe("keyboard list navigation", () => {
  test("arrow down moves the focus to the next note", async () => {
    await app.press("escape");
    await plainClick(app, "Pinned plan");
    await app.press("down");
    await app.mouseMove({ x: 4, y: 4 });
    await waitUntil(() => isRowSelected(app, "Grocery list"));
  });

  test("arrow up moves it back", async () => {
    await app.press("up");
    await app.mouseMove({ x: 4, y: 4 });
    await waitUntil(() => isRowSelected(app, "Pinned plan"));
  });

  test("end jumps to the last note and home to the first", async () => {
    await app.press("end");
    const titles = (await listTexts(app)).filter(Boolean);
    await waitUntil(() =>
      isRowSelected(app, titles[titles.length - 1] as string)
    );
    await app.press("home");
    await waitUntil(() => isRowSelected(app, titles[0] as string));
  });

  test("enter opens the focused note in the editor", async () => {
    await app.press("enter");
    await settle(async () =>
      expect(await count(app, "tab-title")).toBeGreaterThan(0)
    );
  });

  test("delete on a focused note asks nothing and moves it to the trash", async () => {
    await clickId(app, "tab-home");
    await plainClick(app, "Travel itinerary");
    await app.press("delete");
    await settle(async () =>
      expect(await listTexts(app)).not.toContain("Travel itinerary")
    );
  });
});
