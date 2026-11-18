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

import { test, type Locator, type Page } from "@playwright/test";
import { getTestId } from "../utils";
import { generateSync } from "otplib";
import { openSync, closeSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const TOTP_STEP = 30 * 1000;

async function claimTotp(secret: string) {
  let step = Math.floor(Date.now() / TOTP_STEP);
  for (;;) {
    try {
      closeSync(
        openSync(path.join(tmpdir(), `nn-e2e-totp-${step}`), "wx")
      );
      break;
    } catch {
      step++;
    }
  }
  const wait = step * TOTP_STEP - Date.now() + 1000;
  if (wait > 0) {
    test.info().setTimeout(test.info().timeout + wait);
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  return generateSync({ secret });
}

type User = {
  email: string;
  password: string;
  key?: string;
  totpSecret: string;
};

export class AuthModel {
  private readonly page: Page;
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator(getTestId("email"));
    this.passwordInput = page.locator(getTestId("password"));
    this.submitButton = page.locator(getTestId("submitButton"));
  }

  async goto() {
    await this.page.goto("/login");
    await this.ready();
  }

  async ready() {
    await this.submitButton.waitFor({ state: "visible" });
    return true;
  }

  async login(user: Partial<User>) {
    if (!user.email && !user.password) return;

    let passwordFilled = false;
    if (user.email) {
      await this.emailInput.fill(user.email);
      if (user.password && (await this.passwordInput.isVisible())) {
        await this.passwordInput.fill(user.password);
        passwordFilled = true;
      }
      await this.submitButton.click();
    }

    if (user.totpSecret) {
      const token = await claimTotp(user.totpSecret);
      const firstDigit = this.page
        .locator(getTestId("otp-input-0"))
        .or(this.page.locator('input[autocomplete="one-time-code"]').first());
      await firstDigit.click();
      await this.page.keyboard.type(token);

      await this.submitButton.click();
    }

    if (user.password && !passwordFilled) {
      await this.passwordInput.fill(user.password);

      await this.submitButton.click();
    }

    await this.page.locator(getTestId("close-plans")).click();

    await this.page
      .locator(getTestId("sync-status-syncing"))
      .waitFor({ state: "visible" });
  }
}
