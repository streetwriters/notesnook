const { test } = require("@playwright/test");
const { getTestId } = require("./utils");
const { useContextMenu, clickMenuItem } = require("./utils/actions");
const { createNoteAndCheckPresence } = require("./utils/conditions");
const Menu = require("./utils/menuitemidbuilder");

// test.skip(
//   "TODO: make sure to navigate to home if there are 0 notes in a color"
// );

/**
 * @type {import("@playwright/test").Page}
 */
var page = null;
global.page = null;

test.beforeEach(async ({ page: _page, baseURL }) => {
  global.page = _page;
  page = _page;
  await page.goto(baseURL);
  await page.waitForSelector(getTestId("routeHeader"));
});

test("delete the last note of a color", async ({ page }) => {
  const noteSelector = await createNoteAndCheckPresence();

  await useContextMenu(noteSelector, async () => {
    await clickMenuItem("colors");
    await clickMenuItem("red");
  });

  const navItem = new Menu("navitem").item("red").build();
  await page.waitForSelector(navItem);

  await useContextMenu(noteSelector, async () => {
    await clickMenuItem("movetotrash");
  });

  await page.click(new Menu("navitem").item("trash").build());
});
