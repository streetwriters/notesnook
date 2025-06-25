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

import { authenticator } from "otplib";
import { Tests } from "./utils";

import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, ".env.local") });

const USER = {
  login: {
    email: process.env.USER_EMAIL,
    password: process.env.CURRENT_USER_PASSWORD,
    key: process.env.CURRENT_USER_KEY,
    totpSecret: process.env.USER_TOTP_SECRET
  }
};

async function login() {
  await Tests.fromText("Login to encrypt and sync notes").tap();
  await Tests.fromId("input.email").element.typeText(USER.login.email!);
  await Tests.fromText("Continue").tap();
  await Tests.sleep(3000);
  await Tests.fromId("input.totp").element.typeText(
    authenticator.generate(USER.login.totpSecret!)
  );
  await Tests.fromText("Next").tap();
  await Tests.sleep(3000);
  await Tests.fromId("input.password").element.typeText(USER.login.password!);
  await Tests.fromId("input.password").element.tapReturnKey();
}

// async function deleteAccount() {
//   await tapByText("Account Settings");
//   await sleep(2000);
//   await tapByText("Delete account");
//   await elementById("input-value").typeText(USER.password);
//   await tapByText("Delete");
//   await sleep(5000);
// }

// async function signup() {
//   await tapByText("Login to sync your notes.");
//   await sleep(500);
//   await tapByText("Don't have an account? Sign up");
//   await elementById("input.email").typeText(USER.signup.email);
//   await elementById("input.password").typeText(USER.signup.password);
//   await elementById("input.confirmPassword").typeText(USER.signup.password);
//   await elementById("input.confirmPassword").tapReturnKey();
// }

describe("AUTH", () => {
  it("Login", async () => {
    await Tests.prepare();
    await login();
    await Tests.sleep(10000);
    await Tests.fromText("Login to encrypt and sync notes").isNotVisible();
  });
});
