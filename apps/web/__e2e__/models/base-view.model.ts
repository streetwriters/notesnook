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

type Sort = {
  orderBy: "ascendingOrder" | "descendingOrder";
  sortBy: "dateCreated" | "dateEdited";
  groupBy: "abc" | "none" | "default" | "year" | "month" | "week";
};

export class BaseViewModel {
  protected readonly page: Page;
  protected readonly list: Locator;
  private readonly listPlaceholder: Locator;
  private readonly sortByButton: Locator;
  private readonly groupBy: Locator;
  private readonly orderBy: Locator;
  private readonly sortBy: Locator;
  private readonly ascendingOrder: Locator;
  private readonly descendingOrder: Locator;
  private readonly abcOrder: Locator;
  private readonly dateCreated: Locator;
  private readonly dateEdited: Locator;
  private readonly title: Locator;
  private readonly none: Locator;
  private readonly default: Locator;
  private readonly year: Locator;
  private readonly month: Locator;
  private readonly week: Locator;

  constructor(page: Page, pageId: string) {
    this.page = page;
    this.list = page.locator(`#${pageId} >> ${getTestId("note-list")}`);
    this.listPlaceholder = page.locator(
      `#${pageId} >> ${getTestId("list-placeholder")}`
    );

    this.sortByButton = page.locator(getTestId("sort-icon-button"));

    this.groupBy = page.locator(getTestId("menuitem-groupBy"));
    this.abcOrder = page.locator(getTestId("menuitem-abc"));
    this.none = page.locator(getTestId("menuitem-none"));
    this.default = page.locator(getTestId("menuitem-default"));
    this.year = page.locator(getTestId("menuitem-year"));
    this.month = page.locator(getTestId("menuitem-month"));
    this.week = page.locator(getTestId("menuitem-week"));

    this.orderBy = page.locator(getTestId("menuitem-sortDirection"));
    this.ascendingOrder = page.locator(getTestId("menuitem-asc"));
    this.descendingOrder = page.locator(getTestId("menuitem-desc"));

    this.sortBy = page.locator(getTestId("menuitem-sortBy"));
    this.dateCreated = page.locator(getTestId("menuitem-dateCreated"));
    this.dateEdited = page.locator(getTestId("menuitem-dateEdited"));
    this.title = page.locator(getTestId("menuitem-title"));
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

  async sort(sort: Sort, isTopic: boolean = false) {
    if (isTopic) await this.sortByButton.last().click();
    else await this.sortByButton.first().click();
    if (sort.orderBy === "ascendingOrder") {
      await this.orderBy.first().click();
      await this.ascendingOrder.first().click();
    } else if (sort.orderBy === "descendingOrder") {
      await this.orderBy.first().click();
      await this.descendingOrder.first().click();
    }

    if (isTopic) await this.sortByButton.last().click();
    else await this.sortByButton.first().click();
    if (sort.sortBy === "dateCreated") {
      this.sortBy.first().click();
      this.dateCreated.first().click;
    } else if (sort.sortBy === "dateEdited") {
      this.sortBy.first().click();
      this.dateEdited.first().click;
    }

    //await this.sortByButton.first().click();
    if (sort.groupBy === "abc") {
      this.groupBy.first().click();
      this.abcOrder.first().click();
    } else if (sort.groupBy === "default") {
      this.groupBy.first().click();
      this.default.first().click();
    } else if (sort.groupBy === "month") {
      this.groupBy.first().click();
      this.month.first().click();
    } else if (sort.groupBy === "none") {
      this.groupBy.first().click();
      this.none.first().click();
    } else if (sort.groupBy === "week") {
      this.groupBy.first().click();
      this.week.first().click();
    } else if (sort.groupBy === "year") {
      this.groupBy.first().click();
      this.year.first().click();
    }
  }
}
