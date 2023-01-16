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

import { Locator } from "@playwright/test";
import { getTestId } from "../utils";
import { BaseItemModel } from "./base-item.model";
import { ContextMenuModel } from "./context-menu.model";

export class TrashItemModel extends BaseItemModel {
  private readonly contextMenu: ContextMenuModel;

  constructor(locator: Locator) {
    super(locator);
    this.contextMenu = new ContextMenuModel(locator.page());
  }

  async restore() {
    await this.contextMenu.open(this.locator);
    await this.contextMenu.clickOnItem("restore");
    await this.contextMenu.close();
  }

  async delete() {
    await this.contextMenu.open(this.locator);
    await this.contextMenu.clickOnItem("delete");

    await this.locator.page().locator(getTestId("dialog-yes")).click();
  }
}
