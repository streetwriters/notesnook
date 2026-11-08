import { afterAll, beforeAll, describe, expect, test, afterEach } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import {
  clickId,
  count,
  expectListed,
  expectNotListed,
  goTo,
  groupHeaderTexts,
  openTab,
  settle,
  startViews,
  resetUi
} from "./views";

let app: DesktopApp;

beforeAll(async () => {
  app = await startViews();
});

afterAll(async () => {
  await app.close();
});

afterEach(async () => {
  await resetUi(app);
});

describe("notes route", () => {
  test("lists active notes only, pinned first", async () => {
    await goTo(app, "Notes");
    await expectListed(app, [
      "Pinned plan",
      "Grocery list",
      "Travel itinerary"
    ]);
    await expectNotListed(app, ["Old archive", "Deleted draft"]);
  });

  test("shows group headers for pinned and date groups", async () => {
    await settle(async () => {
      const headers = await groupHeaderTexts(app);
      expect(headers.length).toBeGreaterThan(0);
      expect(headers).toContain("Pinned");
    });
  });
});

describe("favorites route", () => {
  test("lists only favorite notes", async () => {
    await goTo(app, "Favorites");
    await expectListed(app, ["Pinned plan"]);
    await expectNotListed(app, ["Grocery list", "Travel itinerary"]);
  });
});

describe("archive route", () => {
  test("lists archived notes", async () => {
    await goTo(app, "Archive");
    await expectListed(app, ["Old archive"]);
    await expectNotListed(app, ["Pinned plan"]);
  });
});

describe("trash route", () => {
  test("lists trashed notes", async () => {
    await goTo(app, "Trash");
    await expectListed(app, ["Deleted draft"]);
    await expectNotListed(app, ["Pinned plan"]);
  });
});

describe("reminders route", () => {
  test("lists reminders with their titles", async () => {
    await goTo(app, "Reminders");
    await expectListed(app, ["Pay rent", "Call mom"]);
  });
});

describe("notebooks tab", () => {
  test("lists seeded notebooks in the list pane", async () => {
    await openTab(app, "notebooks");
    await clickId(app, "tab-notebooks");
    await settle(async () =>
      expect(await count(app, "notebooks-list")).toBe(1)
    );
  });
});

describe("tags tab", () => {
  test("lists seeded tags in the list pane", async () => {
    await openTab(app, "tags");
    await settle(async () => expect(await count(app, "tags")).toBe(1));
  });
});
