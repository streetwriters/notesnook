const { Page, test, expect } = require("@playwright/test");
const { getTestId, isTestAll, loginUser, USER } = require("./utils");
const { isAbsent, isPresent } = require("./utils/conditions");

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

test.only("login user and change password repeatedly", async ({
  page,
  browserName,
}) => {
  test.setTimeout(0);
  test.skip(browserName !== "chromium", "Cannot run in parallel.");

  let currentPassword = "";
  let newPassword = USER.password;
  let email = USER.email;

  for (let i = 0; i < 10; i++) {
    await test.step(
      `login user using password ${currentPassword} (${i})`,
      async () => {
        await loginUser({
          email,
          password: currentPassword,
        });

        await page.waitForSelector(getTestId("sync-status-success"));

        await page.click(getTestId("navitem-settings"));

        await page.click(getTestId("settings-change-password"));

        await page.waitForSelector(getTestId("dialog-yes"));

        await page.fill(getTestId("dialog-password"), currentPassword);

        await page.fill(getTestId("dialog-new-password"), newPassword);

        await page.click(getTestId("dialog-yes"));

        expect(await isAbsent(getTestId("dialog-yes"), 60 * 1000)).toBe(true);

        await page.click(getTestId("settings-logout"));

        await page.waitForSelector(getTestId("dialog-yes"));

        await page.click(getTestId("dialog-yes"));

        expect(await isAbsent(getTestId("navitem-sync"))).toBe(true);

        const cPassword = currentPassword;
        currentPassword = newPassword;
        newPassword = cPassword;
      }
    );
  }
});
