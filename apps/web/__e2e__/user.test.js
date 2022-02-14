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

async function logoutUser() {
  await page.click(getTestId("navitem-settings"));

  await page.click(getTestId("settings-logout"));

  await page.waitForSelector(getTestId("dialog-yes"));

  await page.click(getTestId("dialog-yes"));

  expect(await isAbsent(getTestId("navitem-sync"))).toBe(true);
}

async function forceExpireSession() {
  await page.evaluate(() => {
    window.localStorage.setItem("sessionExpired", "true");
  });
  await page.reload();
}

test("login user", async () => {
  await loginUser();

  expect(await isPresent(getTestId("navitem-sync"))).toBe(true);
});

test("logout user", async () => {
  await loginUser();
  await logoutUser();
});

test("login user and change password repeatedly", async ({
  page,
  browserName,
}) => {
  test.setTimeout(6 * 60 * 1000);
  test.skip(browserName !== "chromium", "Cannot run in parallel.");

  let currentPassword = USER.password;
  let newPassword = "";
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

        await logoutUser();

        const cPassword = currentPassword;
        currentPassword = newPassword;
        newPassword = cPassword;
      }
    );
  }
});

test("reset user password using recovery key", async ({
  page,
  browserName,
}) => {
  test.setTimeout(2 * 60 * 1000);
  test.skip(browserName !== "chromium", "Cannot run in parallel.");

  await recoverAccount(async ({ currentKey }) => {
    await page.click(getTestId("step-recovery-key"));

    await page.waitForSelector(getTestId("step-recovery-key"));

    await page.fill(getTestId("recovery_key"), currentKey);

    await page.click(getTestId("step-next"));
  });
});

test("reset user password after session expiry", async ({
  page,
  browserName,
}) => {
  test.setTimeout(2 * 60 * 1000);
  test.skip(browserName !== "chromium", "Cannot run in parallel.");

  let newPassword = "";
  let newKey = "";

  let currentPassword = USER.password;
  let currentKey = "";

  let email = USER.email;

  for (let i = 0; i <= 1; ++i) {
    await loginUser({ email, password: currentPassword });

    await forceExpireSession();

    await page.click(getTestId("auth-forgot-password"));

    await page.click(getTestId("submitButton"));

    await page.waitForSelector(getTestId("step-new-password"));

    await page.fill(getTestId("new_password"), newPassword);

    await page.click(getTestId("step-next"));

    await page.waitForSelector(getTestId("step-finished"));

    const actualRecoveryKey = await page.innerText(
      getTestId("new-recovery-key")
    );
    expect(actualRecoveryKey).toBe(newKey);

    await page.click(getTestId("step-finish"));

    await loginUser({ password: newPassword }, false);

    await page.waitForSelector(getTestId("sync-status-success"));

    await logoutUser();

    const cPassword = currentPassword;
    currentPassword = newPassword;
    newPassword = cPassword;

    const cKey = currentKey;
    currentKey = newKey;
    newKey = cKey;
  }
});

test("reset user password using old password", async ({
  page,
  browserName,
}) => {
  test.setTimeout(2 * 60 * 1000);
  test.skip(browserName !== "chromium", "Cannot run in parallel.");

  await recoverAccount(async ({ currentPassword }) => {
    await page.click(getTestId("step-old-password"));

    await page.waitForSelector(getTestId("step-old-password"));

    await page.fill(getTestId("old_password"), currentPassword);

    await page.click(getTestId("step-next"));
  });
});

async function recoverAccount(submitRecoveryData) {
  let newPassword = "";
  let newKey = "";

  let currentPassword = USER.password;
  let currentKey = "";

  let email = USER.email;

  for (let i = 0; i <= 1; ++i) {
    await page.click(getTestId("navitem-login"));

    await page.click(getTestId("auth-forgot-password"));

    await page.fill(getTestId("email"), email);

    await page.click(getTestId("submitButton"));

    await page.waitForSelector(getTestId("step-recovery-options"));

    await submitRecoveryData({ currentPassword, currentKey });

    await page.waitForSelector(getTestId("step-backup-data"));

    await page.click(getTestId("step-next"));

    await page.waitForSelector(getTestId("step-new-password"));

    await page.fill(getTestId("new_password"), newPassword);

    await page.click(getTestId("step-next"));

    await page.waitForSelector(getTestId("step-finished"));

    const actualRecoveryKey = await page.innerText(
      getTestId("new-recovery-key")
    );
    expect(actualRecoveryKey).toBe(newKey);

    await page.click(getTestId("step-finish"));

    await loginUser({ email, password: newPassword }, false);

    await page.waitForSelector(getTestId("sync-status-success"));

    await logoutUser();

    const cPassword = currentPassword;
    currentPassword = newPassword;
    newPassword = cPassword;

    const cKey = currentKey;
    currentKey = newKey;
    newKey = cKey;
  }
}
