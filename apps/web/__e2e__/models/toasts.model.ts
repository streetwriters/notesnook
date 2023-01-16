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

import { Locator, Page } from "@playwright/test";
import { getTestId } from "../utils";

export class ToastsModel {
  private readonly toasts: Locator;
  private readonly toastMessage: Locator;

  constructor(page: Page) {
    this.toasts = page.locator(".toasts-container > div");
    // this.toastMessage = this.toast.locator(getTestId("toast-message"));
  }

  count() {
    return this.toasts.count();
  }

  async waitForToast(message: string) {
    await this.toasts
      .locator(getTestId("toast-message"), { hasText: message })
      .waitFor();
    return true;
  }
}
