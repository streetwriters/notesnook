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

  expect(await isAbsent(getTestId("sync-status-synced"))).toBe(true);
}

async function forceExpireSession() {
  await page.evaluate(() => {
    window.localStorage.setItem("sessionExpired", "true");
  });
  await page.reload();
}

test("login user", async () => {
  await loginUser();

  expect(await isPresent(getTestId("sync-status-completed"))).toBe(true);
});

test("logout user", async () => {
  await loginUser();
  await logoutUser();
});

test("login user and change password repeatedly", async ({
  page,
  browserName,
}) => {
  test.setTimeout(2 * 60 * 1000);
  test.skip(browserName !== "chromium", "Cannot run in parallel.");

  let currentPassword = USER.CURRENT.password;
  let newPassword = USER.NEW.password;
  let email = USER.email;

  for (let i = 0; i < 2; i++) {
    await test.step(
      `login user using password ${currentPassword} (${i})`,
      async () => {
        await loginUser({
          email,
          password: currentPassword,
        });

        await page.waitForSelector(getTestId("sync-status-synced"));

        await page.click(getTestId("navitem-settings"));

        await page.click(getTestId("settings-change-password"));

        await page.waitForSelector(getTestId("dialog-yes"));

        await page.fill(getTestId("dialog-password"), currentPassword);

        await page.fill(getTestId("dialog-new-password"), newPassword);

        await page.click(getTestId("dialog-yes"));

        expect(await isAbsent(getTestId("dialog-yes"), 60 * 1000)).toBe(true);

        await logoutUser();

        await page.reload();

        await page.waitForTimeout(2000);

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

    await page.fill(getTestId("recoveryKey"), currentKey);

    await page.click(getTestId("submitButton"));
  });
});

test("reset user password after session expiry", async ({
  page,
  browserName,
}) => {
  test.setTimeout(2 * 60 * 1000);
  test.skip(browserName !== "chromium", "Cannot run in parallel.");

  let currentPassword = USER.CURRENT.password;
  let currentKey = USER.CURRENT.key;

  let newPassword = USER.NEW.password;
  let newKey = USER.NEW.key;

  let email = USER.email;

  for (let i = 0; i <= 1; ++i) {
    await loginUser({ email, password: currentPassword });

    await forceExpireSession();

    await page.click(getTestId("auth-forgot-password"));

    await page.click(getTestId("submitButton"));

    await page.waitForSelector(getTestId("step-new-password"));

    await page.fill(getTestId("password"), newPassword);

    await page.fill(getTestId("confirmPassword"), newPassword);

    await page.click(getTestId("submitButton"));

    await page.waitForSelector(getTestId("step-finished"));

    const actualRecoveryKey = await page.innerText(getTestId("recoveryKey"));
    expect(actualRecoveryKey).toBe(newKey);

    await page.click(getTestId("dialog-yes"));

    await page.click(getTestId("submitButton"));

    await loginUser({ password: newPassword }, false);

    await page.waitForSelector(getTestId("sync-status-synced"));

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

    await page.click(getTestId("submitButton"));
  });
});

async function recoverAccount(submitRecoveryData) {
  let currentPassword = USER.CURRENT.password;
  let currentKey = USER.CURRENT.key;

  let newPassword = USER.NEW.password;
  let newKey = USER.NEW.key;

  let email = USER.email;

  for (let i = 0; i <= 1; ++i) {
    await page.click(getTestId("navitem-login"));

    await page.click(getTestId("auth-forgot-password"));

    await page.fill(getTestId("email"), email);

    await page.click(getTestId("submitButton"));

    await page.waitForNavigation({ url: /account\/recovery/ });

    await page.waitForSelector(getTestId("step-recovery-methods"));

    await submitRecoveryData({ currentPassword, currentKey });

    await page.waitForSelector(getTestId("step-backup-data"));

    await page.click(getTestId("submitButton"));

    await page.waitForSelector(getTestId("step-new-password"));

    await page.fill(getTestId("password"), newPassword);

    await page.fill(getTestId("confirmPassword"), newPassword);

    await page.click(getTestId("submitButton"));

    await page.waitForSelector(getTestId("step-finished"));

    const actualRecoveryKey = await page.innerText(getTestId("recoveryKey"));
    expect(actualRecoveryKey).toBe(newKey);

    await page.click(getTestId("dialog-yes"));

    await page.click(getTestId("submitButton"));

    await loginUser({ email, password: newPassword }, false);

    await page.waitForSelector(getTestId("sync-status-synced"));

    await logoutUser();

    const cPassword = currentPassword;
    currentPassword = newPassword;
    newPassword = cPassword;

    const cKey = currentKey;
    currentKey = newKey;
    newKey = cKey;
  }
}
