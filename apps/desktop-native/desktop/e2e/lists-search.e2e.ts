import { afterAll, beforeAll, describe, expect, test, afterEach } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import {
  count,
  expectListed,
  expectNotListed,
  goTo,
  listTexts,
  settle,
  startViews,
  resetUi
} from "./views";
import { typeInto } from "./dialogs";

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

describe("search", () => {
  test("typing filters the notes list", async () => {
    await typeInto(app, "search-input", "grocery");
    await expectListed(app, ["Grocery list"]);
    await expectNotListed(app, ["Travel itinerary"]);
  });

  test("a query without matches shows the empty search placeholder", async () => {
    const [field] = await app.query("testID", "search-input", true);
    await app.click(field.tag);
    await app.press("mod-a");
    await app.typeText(field.tag, "zzzqq");
    await settle(async () => {
      expect(await listTexts(app)).toHaveLength(0);
      expect(await count(app, "list-placeholder")).toBe(1);
    });
  });

  test("clearing the query restores the full list", async () => {
    const [field] = await app.query("testID", "search-input", true);
    await app.click(field.tag);
    await app.press("mod-a");
    await app.press("backspace");
    await expectListed(app, [
      "Pinned plan",
      "Grocery list",
      "Travel itinerary"
    ]);
  });
});
