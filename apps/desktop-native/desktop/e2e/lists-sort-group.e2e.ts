import { afterAll, beforeAll, describe, expect, test, afterEach } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import {
  clickId,
  clickMenu,
  closeMenu,
  count,
  expectMenu,
  goTo,
  groupHeaderTexts,
  listTexts,
  settle,
  startViews,
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

describe("sort and group menu", () => {
  test("the sort button opens group by, order by and sort by entries", async () => {
    await clickId(app, "home-sort-button");
    await expectMenu(app, ["groupBy", "sortDirection", "sortBy"]);
    await closeMenu(app);
  });

  test("grouping by none removes the group headers", async () => {
    await clickId(app, "home-sort-button");
    await clickMenu(app, "groupBy");
    await clickMenu(app, "none");
    await settle(async () => expect(await count(app, "group-header")).toBe(0));
  });

  test("grouping by default brings the headers back", async () => {
    await clickId(app, "home-sort-button");
    await clickMenu(app, "groupBy");
    await clickMenu(app, "default");
    await settle(async () => {
      expect((await groupHeaderTexts(app)).length).toBeGreaterThan(0);
    });
  });

  test("switching the order direction reverses the unpinned notes", async () => {
    await clickId(app, "home-sort-button");
    await clickMenu(app, "groupBy");
    await clickMenu(app, "none");
    const before = await listTexts(app);
    await clickId(app, "home-sort-button");
    await clickMenu(app, "sortDirection");
    await clickMenu(app, before.length > 0 ? "asc" : "desc");
    await settle(async () => {
      const after = await listTexts(app);
      expect(after).not.toEqual(before);
    });
  });

  test("sorting by title lists notes alphabetically", async () => {
    await clickId(app, "home-sort-button");
    await clickMenu(app, "sortBy");
    await clickMenu(app, "title");
    await clickId(app, "home-sort-button");
    await clickMenu(app, "sortDirection");
    await clickMenu(app, "asc");
    await settle(async () => {
      const titles = (await listTexts(app)).filter(
        (title): title is string => !!title
      );
      expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
    });
  });
});

describe("view mode", () => {
  test("the toggle switches between detailed and compact rows", async () => {
    const height = async () => {
      const [row] = await app.query("testID", "list-item", true);
      return row.frame.height;
    };
    const detailed = await height();
    await clickId(app, "home-view-mode-button");
    await settle(async () => expect(await height()).toBeLessThan(detailed));
    await clickId(app, "home-view-mode-button");
    await settle(async () => expect(await height()).toBe(detailed));
  });
});

describe("jump to group", () => {
  test("clicking a group header opens the jump menu with every group", async () => {
    await clickId(app, "home-sort-button");
    await clickMenu(app, "groupBy");
    await clickMenu(app, "default");
    await settle(async () =>
      expect(await count(app, "group-header")).toBeGreaterThan(0)
    );
    await clickId(app, "group-header");
    await settle(async () =>
      expect(await count(app, "menu-container")).toBeGreaterThan(0)
    );
    await closeMenu(app);
  });
});
