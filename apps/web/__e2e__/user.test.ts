/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { test, expect } from "@playwright/test";
import { AppModel } from "./models/app.model";
import { getTestId, USER } from "./utils";

// async function forceExpireSession() {
//   await page.evaluate(() => {
//     window.localStorage.setItem("sessionExpired", "true");
//   });
//   await page.reload();
// }

test.setTimeout(45 * 1000);

test("login user", async ({ page }) => {
  const app = new AppModel(page);
  await app.auth.goto();

  await app.auth.login(USER.CURRENT);

  const settings = await app.goToSettings();
  expect(await settings.isLoggedIn()).toBeTruthy();
});

test("logout user", async ({ page }) => {
  const app = new AppModel(page);
  await app.auth.goto();
  await app.auth.login(USER.CURRENT);

  const settings = await app.goToSettings();
  await settings?.logout();

  expect(await settings.isLoggedIn()).toBeFalsy();
});

test("check recovery key of user", async ({ page }) => {
  const app = new AppModel(page);
  await app.auth.goto();
  await app.auth.login(USER.CURRENT);
  const settings = await app.goToSettings();

  const key =
    USER.CURRENT.password &&
    (await settings.getRecoveryKey(USER.CURRENT.password));

  expect(key?.length).toBeGreaterThan(0);
});

test("login user & wait for sync", async ({ page }, info) => {
  info.setTimeout(45 * 1000);

  const app = new AppModel(page);
  await app.auth.goto();

  await app.auth.login(USER.CURRENT);

  await app.waitForSync("synced");
  expect(await app.isSynced()).toBeTruthy();
});

test("logged in user should not be able to open unauthorized routes", async ({
  page
}, info) => {
  info.setTimeout(45 * 1000);

  const app = new AppModel(page);
  await app.auth.goto();
  await app.auth.login(USER.CURRENT);

  const unauthorizedRoutes = [
    "/login",
    "/signup",
    "/recover",
    "/mfa/code",
    "/mfa/select"
  ] as const;

  for (const route of unauthorizedRoutes) {
    await page.goto(route);

    await page.waitForURL(/\/notes/gm);
    await page.waitForTimeout(1000);
    expect(await app.navigation.findItem("Notes")).toBeDefined();
  }
});

// test("login user and change password repeatedly", async ({
//   page,
//   browserName
// }) => {
//   test.setTimeout(2 * 60 * 1000);
//   test.skip(browserName !== "chromium", "Cannot run in parallel.");

//   let currentPassword = USER.CURRENT.password;
//   let newPassword = USER.NEW.password;
//   let email = USER.email;

//   for (let i = 0; i < 3; i++) {
//     // eslint-disable-next-line no-loop-func
//     await test.step(`login user using password ${currentPassword} (${i})`, async () => {
//       await loginUser({
//         email,
//         password: currentPassword
//       });

//       await page.waitForSelector(getTestId("sync-status-synced"));

//       await page.click(getTestId("navitem-settings"));

//       await page.click(getTestId("settings-change-password"));

//       await page.waitForSelector(getTestId("dialog-yes"));

//       await page.fill(getTestId("dialog-password"), currentPassword);

//       await page.fill(getTestId("dialog-new-password"), newPassword);

//       await page.click(getTestId("dialog-yes"));

//       expect(await isAbsent(getTestId("dialog-yes"), 60 * 1000)).toBe(true);

//       await logoutUser();

//       await page.reload();

//       await page.waitForTimeout(2000);

//       const cPassword = currentPassword;
//       currentPassword = newPassword;
//       newPassword = cPassword;
//     });
//   }
// });

// test("reset user password using recovery key", async ({
//   page,
//   browserName
// }) => {
//   test.setTimeout(2 * 60 * 1000);
//   test.skip(browserName !== "chromium", "Cannot run in parallel.");

//   await recoverAccount(async ({ currentKey }) => {
//     await page.click(getTestId("step-recovery-key"));

//     await page.waitForSelector(getTestId("step-recovery-key"));

//     await page.fill(getTestId("recoveryKey"), currentKey);

//     await page.click(getTestId("submitButton"));
//   });
// });

// test("reset user password after session expiry", async ({
//   page,
//   browserName
// }) => {
//   test.setTimeout(2 * 60 * 1000);
//   test.skip(browserName !== "chromium", "Cannot run in parallel.");

//   let currentPassword = USER.CURRENT.password;
//   let currentKey = USER.CURRENT.key;

//   let newPassword = USER.NEW.password;
//   let newKey = USER.NEW.key;

//   let email = USER.email;

//   for (let i = 0; i <= 1; ++i) {
//     await loginUser({ email, password: currentPassword });

//     await forceExpireSession();

//     await page.click(getTestId("auth-forgot-password"));

//     await page.click(getTestId("submitButton"));

//     await page.waitForSelector(getTestId("step-new-password"));

//     await page.fill(getTestId("password"), newPassword);

//     await page.fill(getTestId("confirmPassword"), newPassword);

//     await page.click(getTestId("submitButton"));

//     await page.waitForSelector(getTestId("step-finished"));

//     const actualRecoveryKey = await page.innerText(getTestId("recoveryKey"));
//     expect(actualRecoveryKey).toBe(newKey);

//     await page.click(getTestId("dialog-yes"));

//     await page.click(getTestId("submitButton"));

//     await loginUser({ password: newPassword }, false);

//     await page.waitForSelector(getTestId("sync-status-synced"));

//     await logoutUser();

//     const cPassword = currentPassword;
//     currentPassword = newPassword;
//     newPassword = cPassword;

//     const cKey = currentKey;
//     currentKey = newKey;
//     newKey = cKey;
//   }
// });

// test("reset user password using old password", async ({
//   page,
//   browserName
// }) => {
//   test.setTimeout(2 * 60 * 1000);
//   test.skip(browserName !== "chromium", "Cannot run in parallel.");

//   await recoverAccount(async ({ currentPassword }) => {
//     await page.click(getTestId("step-old-password"));

//     await page.waitForSelector(getTestId("step-old-password"));

//     await page.fill(getTestId("old_password"), currentPassword);

//     await page.click(getTestId("submitButton"));
//   });
// });

// async function recoverAccount(submitRecoveryData) {
//   let currentPassword = USER.CURRENT.password;
//   let currentKey = USER.CURRENT.key;

//   let newPassword = USER.NEW.password;
//   let newKey = USER.NEW.key;

//   let email = USER.email;

//   for (let i = 0; i <= 1; ++i) {
//     await page.click(getTestId("navitem-login"));

//     await page.click(getTestId("auth-forgot-password"));

//     await page.fill(getTestId("email"), email);

//     await page.click(getTestId("submitButton"));

//     await page.waitForNavigation({ url: /account\/recovery/ });

//     await page.waitForSelector(getTestId("step-recovery-methods"));

//     await submitRecoveryData({ currentPassword, currentKey });

//     await page.waitForSelector(getTestId("step-backup-data"));

//     await page.click(getTestId("submitButton"));

//     await page.waitForSelector(getTestId("step-new-password"));

//     await page.fill(getTestId("password"), newPassword);

//     await page.fill(getTestId("confirmPassword"), newPassword);

//     await page.click(getTestId("submitButton"));

//     await page.waitForSelector(getTestId("step-finished"));

//     const actualRecoveryKey = await page.innerText(getTestId("recoveryKey"));
//     expect(actualRecoveryKey).toBe(newKey);

//     await page.click(getTestId("dialog-yes"));

//     await page.click(getTestId("submitButton"));

//     await loginUser({ email, password: newPassword }, false);

//     await page.waitForSelector(getTestId("sync-status-synced"));

//     await logoutUser();

//     const cPassword = currentPassword;
//     currentPassword = newPassword;
//     newPassword = cPassword;

//     const cKey = currentKey;
//     currentKey = newKey;
//     newKey = cKey;
//   }
// }
