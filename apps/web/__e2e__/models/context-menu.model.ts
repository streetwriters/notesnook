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

import { Page, Locator } from "@playwright/test";
import { getTestId } from "../utils";

export class ContextMenuModel {
  readonly menuContainer: Locator;
  readonly titleText: Locator;
  constructor(private readonly page: Page) {
    this.menuContainer = this.page.locator(getTestId(`menu-container`));
    this.titleText = this.page.locator(getTestId(`menu-title`));
  }

  async title() {
    if (!(await this.titleText.isVisible())) return null;
    return await this.titleText.textContent();
  }

  async open(
    locator: Locator,
    button: "left" | "right" | "middle" | undefined = "right"
  ) {
    await locator.click({ button });
    await this.menuContainer.waitFor();
  }

  async clickOnItem(id: string) {
    await this.getItem(id).click();
  }

  getItem(id: string) {
    return this.page.locator(getTestId(`menuitem-${id}`));
  }

  async hasItem(id: string) {
    return (
      (await this.getItem(id).isVisible()) &&
      (await this.getItem(id).isEnabled())
    );
  }

  async close() {
    await this.page.keyboard.press("Escape");
  }
}
