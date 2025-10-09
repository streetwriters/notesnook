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
import { TestBuilder } from "./utils";

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

async function login() {
  await TestBuilder.create()
    .waitAndTapByText("Login to encrypt and sync notes")
    .typeTextById("input.email", USER.login.email!)
    .tapReturnKeyById("input.email")
    .wait(3000)
    .typeTextById("input.totp", authenticator.generate(USER.login.totpSecret!))
    .waitAndTapByText("Next")
    .wait(3000)
    .typeTextById("input.password", USER.login.password!)
    .tapReturnKeyById("input.password")
    .run();
}

describe("AUTH", () => {
  it("Login", async () => {
    await TestBuilder.create()
      .prepare()
      .addStep(login)
      .wait(3000)
      .isNotVisibleByText("Notesnook Plans")
      .run();
  });
});
