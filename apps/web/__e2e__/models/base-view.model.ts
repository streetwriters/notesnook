import { ContextMenuModel } from "./context-menu.model";
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
import { iterateList } from "./utils";

export type Sort = {
  orderBy: "ascendingOrder" | "descendingOrder";
  sortBy: "dateCreated" | "dateEdited" | "dateModified";
  groupBy: "abc" | "none" | "default" | "year" | "month" | "week";
};

export class BaseViewModel {
  protected readonly page: Page;
  protected readonly list: Locator;
  private readonly listPlaceholder: Locator;
  private readonly sortByButton: Locator;

  constructor(page: Page, pageId: string) {
    this.page = page;
    this.list = page.locator(`#${pageId} >> ${getTestId("note-list")}`);
    this.listPlaceholder = page.locator(
      `#${pageId} >> ${getTestId("list-placeholder")}`
    );

    this.sortByButton = this.list.locator(getTestId("sort-icon-button"));
  }

  async findGroup(groupName: string) {
    const locator = this.list.locator(
      `${getTestId(`virtuoso-item-list`)} >> ${getTestId("group-header")}`
    );

    for await (const item of iterateList(locator)) {
      if ((await item.locator(getTestId("title")).textContent()) === groupName)
        return item;
    }
    return undefined;
  }

  protected async *iterateItems() {
    await this.waitForList();
    const locator = this.list.locator(
      `${getTestId(`virtuoso-item-list`)} >> ${getTestId("list-item")}`
    );

    for await (const _item of iterateList(locator)) {
      const id = await _item.getAttribute("id");
      if (!id) return;

      yield this.list.locator(`#${id}`);
    }
    return undefined;
  }

  async waitForItem(title: string) {
    await this.list.locator(getTestId("title"), { hasText: title }).waitFor();
  }

  async waitForList() {
    try {
      await this.listPlaceholder.waitFor({ timeout: 1000 });
    } catch {
      await this.list.waitFor();
    }
  }

  async focus() {
    const items = this.list.locator(
      `${getTestId(`virtuoso-item-list`)} >> ${getTestId("list-item")}`
    );
    await items.nth(0).click();
    await items.nth(0).click();
  }

  // async selectAll() {
  //   await this.press("Control+a");
  // }

  // async selectNext() {
  //   await this.press("ArrowDown");
  // }

  async press(key: string) {
    const itemList = this.list.locator(getTestId(`virtuoso-item-list`));
    await itemList.press(key);
    await this.page.waitForTimeout(300);
  }

  async sort(sort: Sort) {
    const contextMenu: ContextMenuModel = new ContextMenuModel(this.page);

    await contextMenu.open(this.sortByButton, "left");
    if (sort.orderBy === "ascendingOrder") {
      await contextMenu.clickOnItem("sortDirection");
      await contextMenu.clickOnItem("asc");
    } else if (sort.orderBy === "descendingOrder") {
      await contextMenu.clickOnItem("sortDirection");
      await contextMenu.clickOnItem("desc");
    }

    contextMenu.open(this.sortByButton, "left");
    if (sort.sortBy === "dateCreated") {
      await contextMenu.clickOnItem("sortBy");
      await contextMenu.clickOnItem("dateCreated");
    } else if (sort.sortBy === "dateEdited") {
      await contextMenu.clickOnItem("sortBy");
      await contextMenu.clickOnItem("dateEdited");
    } else if (sort.sortBy === "dateModified") {
      await contextMenu.clickOnItem("sortBy");
      await contextMenu.clickOnItem("dateModified");
    }

    contextMenu.open(this.sortByButton, "left");
    if (sort.groupBy === "abc") {
      await contextMenu.clickOnItem("groupBy");
      await contextMenu.clickOnItem("abc");
    } else if (sort.groupBy === "default") {
      await contextMenu.clickOnItem("groupBy");
      await contextMenu.clickOnItem("default");
    } else if (sort.groupBy === "month") {
      await contextMenu.clickOnItem("groupBy");
      await contextMenu.clickOnItem("month");
    } else if (sort.groupBy === "none") {
      await contextMenu.clickOnItem("groupBy");
      await contextMenu.clickOnItem("none");
    } else if (sort.groupBy === "week") {
      await contextMenu.clickOnItem("groupBy");
      await contextMenu.clickOnItem("week");
    } else if (sort.groupBy === "year") {
      await contextMenu.clickOnItem("groupBy");
      await contextMenu.clickOnItem("year");
    }
  }

  async isListFilled() {
    let itemCount = await this.page.locator(getTestId("list-item")).count();
    if (itemCount !== 5) return false;
    return true;
  }
}
