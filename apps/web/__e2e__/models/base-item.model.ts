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

export class BaseItemModel {
  protected readonly page: Page;
  private readonly titleText: Locator;
  readonly descriptionText: Locator;

  constructor(readonly locator: Locator) {
    this.page = locator.page();
    this.titleText = this.locator.locator(getTestId(`title`));
    this.descriptionText = this.locator.locator(getTestId(`description`));
  }

  async isSelected() {
    return (await this.locator.getAttribute("class"))?.includes("selected");
  }

  async isFocused() {
    return await this.locator.evaluate((el) => el === document.activeElement);
  }

  async click() {
    if (!(await this.locator.isVisible()))
      await this.locator.scrollIntoViewIfNeeded();
    await this.locator.click();
  }

  async getId() {
    return (await this.locator.getAttribute("id"))?.replace("id_", "");
  }

  async getTitle() {
    if (await this.titleText.isVisible())
      return (await this.titleText.textContent()) || "";
    return "";
  }

  async getDescription() {
    if (await this.descriptionText.isVisible())
      return (await this.descriptionText.textContent()) || "";
    return "";
  }

  isPresent() {
    return this.locator.isVisible();
  }

  waitFor(state: "attached" | "detached" | "visible" | "hidden") {
    return this.locator.waitFor({ state });
  }
}
