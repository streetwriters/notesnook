/* eslint-disable no-undef */

const { getTestId } = require("./utils");
const { toMatchImageSnapshot } = require("jest-image-snapshot");

expect.extend({ toMatchImageSnapshot });

beforeEach(async () => {
  await page.goto("http://localhost:3000/");
});

function createRoute(key, header) {
  return { buttonId: `navitem-${key}`, header };
}
const routes = [
  createRoute("notes", "Notes"),
  createRoute("notebooks", "Notebooks"),
  createRoute("favorites", "Favorites"),
  createRoute("tags", "Tags"),
  createRoute("trash", "Trash"),
  createRoute("settings", "Settings"),
].map((route) => [route.header, route]);

test.each(routes)("navigating to %s", async (_header, route) => {
  await page.waitForSelector(getTestId(route.buttonId), {
    state: "visible",
  });
  await page.click(getTestId(route.buttonId));
  await expect(page.textContent(getTestId("routeHeader"))).resolves.toBe(
    route.header
  );
  const navItem = await page.$(getTestId(route.buttonId));
  await expect(navItem.screenshot()).resolves.toMatchImageSnapshot({
    failureThreshold: 5,
    failureThresholdType: "percent",
    allowSizeMismatch: true,
  });
});
