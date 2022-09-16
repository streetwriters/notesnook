/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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

import { Locator, Page } from "@playwright/test";
import { getTestId } from "../utils";

type User = {
  email: string;
  password: string;
  key?: string;
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
  }

  async login(user: Partial<User>) {
    if (!user.email && !user.password) return;

    if (user.email) await this.emailInput.fill(user.email);
    if (user.password) await this.passwordInput.fill(user.password);

    await this.submitButton.click();

    await this.page
      .locator(getTestId("sync-status-syncing"))
      .waitFor({ state: "visible" });
  }
}
