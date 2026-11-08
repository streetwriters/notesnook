import { afterAll, beforeAll, describe, expect, test, afterEach } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import {
  closeWithBackdrop,
  count,
  expectClosed,
  openCommandPalette,
  texts,
  typeInto
} from "./dialogs";
import { expectListed, settle, startViews, resetUi } from "./views";

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

describe("command palette navigation", () => {
  test("the palette opens with recent items or an empty hint", async () => {
    await openCommandPalette(app);
    expect(await count(app, "dialog")).toBe(1);
  });

  test("typing lists matching notes, notebooks and tags under group headers", async () => {
    await typeInto(app, "dialog", "Grocery");
    await settle(async () =>
      expect(await texts(app)).toContain("Grocery list")
    );
  });

  test("arrow down then enter opens the highlighted result and closes the palette", async () => {
    await app.press("down");
    await app.press("enter");
    await expectClosed(app, "dialog");
    await expectListed(app, ["Grocery list"]);
  });

  test("the backdrop closes the palette", async () => {
    await openCommandPalette(app);
    await closeWithBackdrop(app, "dialog");
  });

  test("shift enter creates a new note from the query", async () => {
    await openCommandPalette(app);
    await typeInto(app, "dialog", "Brand new note");
    await app.press("shift-enter");
    await expectClosed(app, "dialog");
    await settle(async () =>
      expect(await count(app, "tab-title")).toBeGreaterThan(0)
    );
  });
});
