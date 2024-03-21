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
import { BaseItemModel } from "./base-item.model";
import { ContextMenuModel } from "./context-menu.model";
import { NotesViewModel } from "./notes-view.model";
import { Item } from "./types";
import { confirmDialog, fillItemDialog } from "./utils";
import { getTestId } from "../utils";

export class ItemModel extends BaseItemModel {
  private readonly contextMenu: ContextMenuModel;
  constructor(locator: Locator, private readonly id: "topic" | "tag") {
    super(locator);
    this.contextMenu = new ContextMenuModel(this.page);
  }

  async open() {
    await this.locator.click();
    return new NotesViewModel(
      this.page,
      this.id === "topic" ? "notebook" : "notes",
      "notes"
    );
  }

  async delete() {
    await this.contextMenu.open(this.locator);
    await this.contextMenu.clickOnItem("delete");

    await this.waitFor("detached");
  }

  async deleteWithNotes(deleteContainedNotes = false) {
    await this.contextMenu.open(this.locator);
    await this.contextMenu.clickOnItem("delete");

    if (deleteContainedNotes)
      await this.page.locator("#deleteContainingNotes").check({ force: true });

    await confirmDialog(this.page.locator(getTestId("confirm-dialog")));
    await this.waitFor("detached");
  }

  async editItem(item: Item) {
    await this.contextMenu.open(this.locator);
    await this.contextMenu.clickOnItem("edit");

    await fillItemDialog(this.page, item);
  }

  async createShortcut() {
    await this.contextMenu.open(this.locator);
    await this.contextMenu.clickOnItem("shortcut");
  }

  async removeShortcut() {
    await this.contextMenu.open(this.locator);
    await this.contextMenu.clickOnItem("shortcut");
  }

  async isShortcut() {
    await this.contextMenu.open(this.locator);
    const state =
      (await this.contextMenu.getItem("shortcut").textContent()) ===
      "Remove shortcut";
    await this.contextMenu.close();
    return state;
  }
}
