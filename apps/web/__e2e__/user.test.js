const { Page, test, expect } = require("@playwright/test");
const { getTestId } = require("./utils");
const { isAbsent } = require("./utils/conditions");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env.local") });

/**
 * @type {Page}
 */
var page = null;
global.page = null;
test.beforeEach(async ({ page: _page }) => {
  global.page = _page;
  page = _page;
  await page.goto("http://localhost:3000/");
});

const USER = {
  email: process.env.USER_EMAIL,
  password: process.env.USER_PASSWORD,
};

async function loginUser() {
  await page.click(getTestId("navitem-login"));

  await page.fill(getTestId("email"), USER.email);

  await page.fill(getTestId("password"), USER.password);

  await page.click(getTestId("submitButton"));

  await page.waitForNavigation();

  expect(await isAbsent(getTestId("navitem-login"))).toBe(true);
}

test("login user", async () => {
  await loginUser();
});
