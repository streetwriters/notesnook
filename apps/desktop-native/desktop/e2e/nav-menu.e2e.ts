import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import { navClick, navVisible } from "./nav";
import {
  clickMenu,
  closeMenu,
  expectMenu,
  settle,
  startViews,
  openTab
} from "./views";
import { clickId, count } from "./dialogs";

let app: DesktopApp;

beforeAll(async () => {
  app = await startViews();
});

afterAll(async () => {
  await app.close();
});

describe("navigation tabs", () => {
  test("home, notebooks and tags tabs are present", async () => {
    for (const tab of ["home", "notebooks", "tags"])
      expect(await count(app, `tab-${tab}`)).toBe(1);
  });

  test("the home tab lists the routes", async () => {
    await clickId(app, "tab-home");
    for (const route of [
      "Notes",
      "Favorites",
      "Reminders",
      "Monographs",
      "Archive",
      "Trash"
    ])
      await settle(async () => expect(await navVisible(app, route)).toBe(true));
  });

  test("the notebooks tab lists notebooks and the tags tab lists tags", async () => {
    await openTab(app, "notebooks");
    await settle(async () => expect(await navVisible(app, "Work")).toBe(true));
    await openTab(app, "tags");
    await settle(async () =>
      expect(await navVisible(app, "urgent")).toBe(true)
    );
  });
});

describe("colors section", () => {
  test("seeded colors appear under the routes and open their notes", async () => {
    await clickId(app, "tab-home");
    await settle(async () => expect(await navVisible(app, "Red")).toBe(true));
    await navClick(app, "Red");
    await settle(async () =>
      expect(await app.getByTestId("route-title").textContent()).toBe("Red")
    );
  });

  test("the context menu of a color offers rename and remove", async () => {
    const entry = (await app.query("testID", "title", true)).find(
      (candidate: { text?: string; frame: { x: number } }) =>
        candidate.text === "Red" && candidate.frame.x < 250
    );
    if (!entry) throw new Error("Red not found");
    await app.click(entry.tag, { button: "right" });
    await expectMenu(app, ["rename-color", "remove-color"]);
    await closeMenu(app);
  });
});

describe("tab header buttons", () => {
  test("the notebooks and tags tabs expose sort and create buttons", async () => {
    await openTab(app, "notebooks");
    expect(await count(app, "notebooks-sort-button")).toBe(1);
    expect(await count(app, "create-notebook-button")).toBe(1);
    await openTab(app, "tags");
    expect(await count(app, "tags-sort-button")).toBe(1);
    expect(await count(app, "create-tag-button")).toBe(1);
  });

  test("the notebooks sort button opens the sort menu", async () => {
    await openTab(app, "notebooks");
    await clickId(app, "notebooks-sort-button");
    await expectMenu(app, ["groupBy", "sortDirection", "sortBy"]);
    await closeMenu(app);
  });
});

describe("customize the sidebar", () => {
  test("the home tab context menu offers reset and per route visibility", async () => {
    await clickId(app, "tab-home");
    const entry = await titleEntryNav("Notes");
    await app.click(entry.tag, { button: "right" });
    await expectMenu(app, ["reset-sidebar"]);
    await closeMenu(app);
  });

  test("hiding a route removes it and reset brings it back", async () => {
    const entry = await titleEntryNav("Monographs");
    await app.click(entry.tag, { button: "right" });
    await clickMenu(app, "monographs");
    await settle(async () =>
      expect(await navVisible(app, "Monographs")).toBe(false)
    );
    const notes = await titleEntryNav("Notes");
    await app.click(notes.tag, { button: "right" });
    await clickMenu(app, "reset-sidebar");
    await settle(async () =>
      expect(await navVisible(app, "Monographs")).toBe(true)
    );
  });
});

async function titleEntryNav(title: string) {
  let entry: { tag: number } | undefined;
  await settle(async () => {
    entry = (await app.query("testID", "title", true)).find(
      (candidate: { text?: string; frame: { x: number } }) =>
        candidate.text === title && candidate.frame.x < 250
    );
    expect(entry, title).toBeDefined();
  });
  return entry as { tag: number };
}
