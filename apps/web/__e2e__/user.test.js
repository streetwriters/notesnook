const { Page, test, expect } = require("@playwright/test");
const { getTestId, isTestAll, loginUser } = require("./utils");
const { isAbsent, isPresent } = require("./utils/conditions");
const path = require("path");

/**
 * @type {Page}
 */
var page = null;
global.page = null;
test.beforeEach(async ({ page: _page, baseURL }) => {
  global.page = _page;
  page = _page;
  await page.goto(baseURL);
  await page.waitForSelector(getTestId("routeHeader"));
});

if (!isTestAll()) test.skip();

test("login user", async () => {
  await loginUser();

  expect(await isPresent(getTestId("navitem-sync"))).toBe(true);
});

test("logout user", async () => {
  await loginUser();

  await page.click(getTestId("navitem-settings"));

  await page.click(getTestId("settings-logout"));

  await page.waitForSelector(getTestId("dialog-yes"));

  await page.click(getTestId("dialog-yes"));

  expect(await isAbsent(getTestId("navitem-sync"))).toBe(true);
});
