/* This file is part of the Notesnook project (https://notesnook.com/)
 *
 * Copyright (C) 2022 Streetwriters (Private) Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
  tapByText,
  prepare,
  openSideMenu,
  elementById,
  visibleByText,
  sleep
} from "./utils";

const credentials = {
  username: "testaccount1@notesnook.com",
  password: "testaccount@123"
};

async function login() {
  await tapByText("Login to sync your notes.");
  await elementById("input.email").typeText(credentials.username);
  await elementById("input.password").typeText(credentials.password);
  await elementById("input.password").tapReturnKey();
}

async function deleteAccount() {
  await tapByText("Account Settings");
  await sleep(2000);
  await tapByText("Delete account");
  await elementById("input-value").typeText(credentials.password);
  await tapByText("Delete");
  await sleep(5000);
}

async function signup() {
  await tapByText("Login to sync your notes.");
  await sleep(500);
  await tapByText("Don't have an account? Sign up");
  await elementById("input.email").typeText(credentials.username);
  await elementById("input.password").typeText(credentials.password);
  await elementById("input.confirmPassword").typeText(credentials.password);
  await elementById("input.confirmPassword").tapReturnKey();
}

describe("AUTH", () => {
  it("Sign up", async () => {
    await prepare();
    await openSideMenu();
    await signup();
    await sleep(5000);
    await device.pressBack();
    await sleep(5000);
    await openSideMenu();
    await visibleByText("Tap here to sync your notes.");
  });

  it("Login to account", async () => {
    await prepare();
    await openSideMenu();
    await login();
    await sleep(10000);
    await openSideMenu();
    await visibleByText("Tap here to sync your notes.");
  });

  it("Delete account", async () => {
    await prepare();
    await openSideMenu();
    await login();
    await sleep(15000);
    await openSideMenu();
    await tapByText("Settings");
    await sleep(1000);
    await deleteAccount();
  });
});
