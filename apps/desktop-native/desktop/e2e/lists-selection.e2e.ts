import { afterAll, beforeAll, describe, expect, test, afterEach } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import {
  closeMenu,
  count,
  ctrlClick,
  expectMenu,
  goTo,
  isRowSelected,
  plainClick,
  rightClick,
  shiftClick,
  startViews,
  waitUntil,
  resetUi
} from "./views";

let app: DesktopApp;

beforeAll(async () => {
  app = await startViews();
  await goTo(app, "Notes");
});

afterAll(async () => {
  await app.close();
});

afterEach(async () => {
  await resetUi(app);
});

describe("multi select", () => {
  test("a plain click selects a single note", async () => {
    await plainClick(app, "Grocery list");
    await waitUntil(() => isRowSelected(app, "Grocery list"));
  });

  test("ctrl click adds a second note to the selection", async () => {
    await ctrlClick(app, "Travel itinerary");
    await waitUntil(() => isRowSelected(app, "Travel itinerary"));
    await waitUntil(() => isRowSelected(app, "Grocery list"));
  });

  test("the context menu of a multi selection offers bulk actions", async () => {
    await rightClick(app, "Travel itinerary");
    await expectMenu(app, ["movetotrash"]);
    await closeMenu(app);
  });

  test("escape clears the selection", async () => {
    await app.press("escape");
    await waitUntil(
      async () => !(await isRowSelected(app, "Travel itinerary"))
    );
  });

  test("shift click selects a contiguous range", async () => {
    await plainClick(app, "Pinned plan");
    await shiftClick(app, "Travel itinerary");
    await waitUntil(() => isRowSelected(app, "Grocery list"));
    await waitUntil(() => isRowSelected(app, "Travel itinerary"));
  });

  test("select all selects every note", async () => {
    await app.press("escape");
    await ctrlClick(app, "Grocery list");
    await app.press("mod-a");
    await waitUntil(() => isRowSelected(app, "Pinned plan"));
    await waitUntil(() => isRowSelected(app, "Travel itinerary"));
    expect(await count(app, "list-item")).toBeGreaterThan(2);
  });
});
