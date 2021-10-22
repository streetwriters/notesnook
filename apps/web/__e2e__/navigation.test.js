/* eslint-disable no-undef */

const { test, expect } = require("@playwright/test");
const { getTestId } = require("./utils");

test.beforeEach(async ({ page, baseURL }) => {
  await page.goto(baseURL);
});

function createRoute(key, header) {
  return { buttonId: `navitem-${key}`, header };
}

const routes = [
  createRoute("notes", "Notes"),
  createRoute("notebooks", "Notebooks"),
  createRoute("favorites", "Favorites"),
  createRoute("monographs", "Monographs"),
  createRoute("tags", "Tags"),
  createRoute("trash", "Trash"),
  createRoute("settings", "Settings"),
];

for (let route of routes) {
  test(`navigating to ${route.header}`, async ({ page }) => {
    await page.waitForSelector(getTestId(route.buttonId), {
      state: "visible",
    });
    await page.click(getTestId(route.buttonId));
    await expect(page.inputValue(getTestId("routeHeader"))).resolves.toBe(
      route.header
    );
    await page.waitForTimeout(300);
  });
}
