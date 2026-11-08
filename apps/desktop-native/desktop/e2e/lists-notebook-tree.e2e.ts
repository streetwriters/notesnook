import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import { navVisible } from "./nav";
import {
  clickMenu,
  closeMenu,
  expectMenu,
  openTab,
  settle,
  startViews
} from "./views";
import {
  clickId,
  count,
  expectDialog,
  expectClosed,
  typeInto
} from "./dialogs";

let app: DesktopApp;

beforeAll(async () => {
  app = await startViews({
    seedNotebooks: [
      { title: "Work", children: [{ title: "Plans" }] },
      { title: "Personal" }
    ]
  });
  await openTab(app, "notebooks");
});

afterAll(async () => {
  await app.close();
});

const rowFor = async (title: string) => {
  let entry: { tag: number } | undefined;
  await settle(async () => {
    entry = (await app.query("testID", "title", true)).find(
      (candidate: { text?: string; frame: { x: number } }) =>
        candidate.text === title && candidate.frame.x < 250
    );
    expect(entry, title).toBeDefined();
  });
  return entry as { tag: number };
};

describe("notebook tree in the navigation menu", () => {
  test("expanding a notebook reveals its sub notebooks", async () => {
    expect(await navVisible(app, "Plans")).toBe(false);
    const [expander] = await app.query("testID", "notebook-expand", true);
    await app.click(expander.tag);
    await settle(async () => expect(await navVisible(app, "Plans")).toBe(true));
  });

  test("the context menu of a notebook offers add, edit, move and trash", async () => {
    const work = await rowFor("Work");
    await app.click(work.tag, { button: "right" });
    await expectMenu(app, ["add", "edit", "move", "movetotrash"]);
    await closeMenu(app);
  });

  test("add sub notebook opens the add notebook dialog", async () => {
    const work = await rowFor("Work");
    await app.click(work.tag, { button: "right" });
    await clickMenu(app, "add");
    await expectDialog(app, "add-notebook-dialog");
    await typeInto(app, "title-input", "Reports");
    await clickId(app, "dialog-yes");
    await expectClosed(app, "add-notebook-dialog");
    await settle(async () =>
      expect(await navVisible(app, "Reports")).toBe(true)
    );
  });

  test("the create button in the tab header opens the add notebook dialog", async () => {
    await clickId(app, "create-notebook-button");
    await expectDialog(app, "add-notebook-dialog");
    await app.press("escape");
    await expectClosed(app, "add-notebook-dialog");
    expect(await count(app, "notebook-expand")).toBeGreaterThan(0);
  });
});
