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
import { ContextMenuModel } from "./context-menu.model";
import { fillItemDialog, iterateList } from "./utils";

export class NavigationMenuModel {
  protected readonly page: Page;
  private readonly menu: Locator;

  constructor(page: Page, id: string) {
    this.page = page;
    this.menu = page.locator(getTestId(id));
  }

  async findItem(title: string) {
    for await (const item of this.iterateList()) {
      const menuItem = new NavigationItemModel(item);
      if (!(await menuItem.locator.isVisible())) continue;
      if ((await menuItem.getTitle()) === title) return menuItem;
    }
  }

  waitForItem(title: string) {
    return this.menu
      .locator(getTestId(`navigation-item`), { hasText: title })
      .waitFor();
  }

  async getShortcuts() {
    const shortcuts: string[] = [];
    for await (const item of this.iterateList()) {
      const menuItem = new NavigationItemModel(item);
      if (await menuItem.isShortcut()) {
        const titleText = await menuItem.getTitle();
        if (titleText) shortcuts.push(titleText);
      }
    }
    return shortcuts;
  }

  private async *iterateList() {
    const locator = this.menu.locator(getTestId(`navigation-item`));
    yield* iterateList(locator);
  }
}

class NavigationItemModel {
  // private readonly title: Locator;
  private readonly shortcut: Locator;
  private readonly menu: ContextMenuModel;
  private readonly page: Page;
  constructor(readonly locator: Locator) {
    this.page = locator.page();
    this.shortcut = locator.locator(getTestId("shortcut"));
    this.menu = new ContextMenuModel(this.page);
  }

  async click() {
    await this.locator.click();
  }

  async isShortcut() {
    return await this.shortcut.isVisible();
  }

  async getTitle() {
    return await this.locator.getAttribute("title");
  }

  async renameColor(alias: string) {
    await this.menu.open(this.locator);
    await this.menu.clickOnItem("rename-color");
    await fillItemDialog(this.page, { title: alias });
  }

  async removeColor() {
    await this.menu.open(this.locator);
    await this.menu.clickOnItem("remove-color");
  }

  async removeShortcut() {
    await this.menu.open(this.locator);
    await this.menu.clickOnItem("remove-shortcut");
  }
}
