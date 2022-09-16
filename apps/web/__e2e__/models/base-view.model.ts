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

export class BaseViewModel {
  protected readonly page: Page;
  protected readonly list: Locator;
  private readonly listPlaceholder: Locator;

  constructor(page: Page, pageId: string) {
    this.page = page;
    this.list = page.locator(`#${pageId} >> ${getTestId("note-list")}`);
    this.listPlaceholder = page.locator(
      `#${pageId} >> ${getTestId("list-placeholder")}`
    );
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
}
