import { afterAll, beforeAll, describe, expect, test, afterEach } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import {
  clickMenu,
  closeMenu,
  expectMenu,
  expectNoMenuItems,
  goTo,
  openTab,
  rightClick,
  navRightClick,
  settle,
  startViews,
  resetUi
} from "./views";
import { count, expectClosed, expectDialog } from "./dialogs";

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

describe("note context menu", () => {
  test("a note offers the full set of note actions", async () => {
    await goTo(app, "Notes");
    await rightClick(app, "Grocery list");
    await expectMenu(app, [
      "openinnewtab",
      "pin",
      "favorite",
      "colors",
      "notebooks",
      "add-tags",
      "lock",
      "readonly",
      "export",
      "duplicate",
      "movetotrash"
    ]);
    await closeMenu(app);
  });

  test("pin toggles the pinned state", async () => {
    await rightClick(app, "Grocery list");
    await clickMenu(app, "pin");
    await settle(async () => {
      const entries = await app.query("testID", "group-header", true);
      expect(entries.length).toBeGreaterThan(0);
    });
  });

  test("add tags opens the add tags dialog", async () => {
    await rightClick(app, "Grocery list");
    await clickMenu(app, "add-tags");
    await clickMenu(app, "assign-tags");
    await expectDialog(app, "dialog");
    await app.press("escape");
    await expectClosed(app, "dialog");
  });

  test("move to trash removes the note from the list", async () => {
    await rightClick(app, "Travel itinerary");
    await clickMenu(app, "movetotrash");
    await settle(async () =>
      expect(await count(app, "list-item")).toBeGreaterThan(0)
    );
  });
});

describe("notebook context menu", () => {
  test("a notebook offers edit, move, shortcut and trash", async () => {
    await openTab(app, "notebooks");
    await settle(async () =>
      expect(await count(app, "notebooks-list")).toBe(1)
    );
    await navRightClick(app, "Work");
    await expectMenu(app, ["add", "edit", "move", "shortcut", "movetotrash"]);
    await closeMenu(app);
  });

  test("edit opens the add notebook dialog in edit mode", async () => {
    await navRightClick(app, "Work");
    await clickMenu(app, "edit");
    await expectDialog(app, "add-notebook-dialog", "Edit notebook");
    await app.press("escape");
    await expectClosed(app, "add-notebook-dialog");
  });
});

describe("tag context menu", () => {
  test("a tag offers edit, shortcut and delete", async () => {
    await openTab(app, "tags");
    await settle(async () => expect(await count(app, "tags")).toBe(1));
    await navRightClick(app, "urgent");
    await expectMenu(app, ["edit", "shortcut", "delete"]);
    await closeMenu(app);
  });

  test("edit opens the item dialog prefilled with the tag title", async () => {
    await navRightClick(app, "urgent");
    await clickMenu(app, "edit");
    await expectDialog(app, "item-dialog");
    await app.press("escape");
    await expectClosed(app, "item-dialog");
  });
});

describe("reminder context menu", () => {
  test("a reminder offers edit, mark complete and delete", async () => {
    await goTo(app, "Reminders");
    await rightClick(app, "Pay rent");
    await expectMenu(app, ["edit", "mark-complete", "delete"]);
    await closeMenu(app);
  });

  test("edit opens the add reminder dialog in edit mode", async () => {
    await rightClick(app, "Pay rent");
    await clickMenu(app, "edit");
    await expectDialog(app, "add-reminder-dialog", "Edit reminder");
    await app.press("escape");
    await expectClosed(app, "add-reminder-dialog");
  });
});

describe("trash item context menu", () => {
  test("a trashed note offers restore and permanent delete only", async () => {
    await goTo(app, "Trash");
    await rightClick(app, "Deleted draft");
    await expectMenu(app, ["restore", "delete"]);
    await expectNoMenuItems(app, ["pin", "favorite", "export"]);
    await closeMenu(app);
  });

  test("restore moves the note back to the notes list", async () => {
    await rightClick(app, "Deleted draft");
    await clickMenu(app, "restore");
    await goTo(app, "Notes");
    await settle(async () =>
      expect(await count(app, "list-item")).toBeGreaterThan(0)
    );
  });
});
