const { Page, test, expect } = require("@playwright/test");
const { getTestId, isTestAll } = require("./utils");
const { isAbsent, isPresent } = require("./utils/conditions");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env.local") });

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

const USER = {
  email: process.env.USER_EMAIL,
  password: process.env.USER_PASSWORD,
};

if (!isTestAll()) test.skip();

async function loginUser() {
  await page.click(getTestId("navitem-login"));

  await page.fill(getTestId("email"), USER.email);

  await page.fill(getTestId("password"), USER.password);

  await page.click(getTestId("submitButton"));

  await page.waitForSelector(getTestId("navitem-sync"));

  expect(await isPresent(getTestId("navitem-sync"))).toBe(true);
}

test("login user", async () => {
  await loginUser();
});

test("logout user", async () => {
  await loginUser();

  await page.click(getTestId("navitem-settings"));

  await page.click(getTestId("settings-logout"));

  await page.waitForSelector(getTestId("dialog-yes"));

  await page.click(getTestId("dialog-yes"));

  expect(await isAbsent(getTestId("navitem-sync"))).toBe(true);
});
