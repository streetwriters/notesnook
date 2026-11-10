import { afterAll, beforeAll, describe, expect, test, afterEach } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import {
  clickId,
  count,
  ctrlClick,
  goTo,
  isRowCursor,
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
  await app.waitForIdle();
  await new Promise((resolve) => setTimeout(resolve, 2000));
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
    await ctrlClick(app, "Pinned plan");
    await app.press("down");
    await app.mouseMove({ x: 4, y: 4 });
    await waitUntil(() => isRowCursor(app, "Grocery list"));
  });

  test("arrow down past the last note wraps to the first, like web", async () => {
    await app.press("escape");
    await ctrlClick(app, "Grocery list");
    const rows = (await listTexts(app)).filter(Boolean).length;
    for (let index = 0; index < rows; index++) await app.press("down");
    await app.mouseMove({ x: 4, y: 4 });
    await waitUntil(() => isRowCursor(app, "Grocery list"));
  });

  test("enter opens the focused note in the editor", async () => {
    await app.press("enter");
    await settle(async () =>
      expect(await count(app, "tab-title")).toBeGreaterThan(0)
    );
  });

  test("delete moves the selected notes to the trash", async () => {
    await clickId(app, "tab-home");
    await app.press("escape");
    await plainClick(app, "Pinned plan");
    await ctrlClick(app, "Travel itinerary");
    await app.press("delete");
    await clickId(app, "dialog-yes");
    await settle(async () =>
      expect(await listTexts(app)).not.toContain("Travel itinerary")
    );
  });
});
