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
import { EditorModel } from "./editor.model";
import {
  NoteContextMenuModel,
  NotePropertiesModel
} from "./note-properties.model";
import { iterateList } from "./utils";

export class NoteItemModel extends BaseItemModel {
  readonly properties: NotePropertiesModel;
  readonly contextMenu: NoteContextMenuModel;
  private readonly editor: EditorModel;
  constructor(locator: Locator) {
    super(locator);
    this.properties = new NotePropertiesModel(this.page, locator);
    this.contextMenu = new NoteContextMenuModel(this.page, locator);
    this.editor = new EditorModel(this.page);
  }

  async openNote(openInNewTab?: boolean) {
    await this.click({ middleClick: openInNewTab });
    const title = await this.getTitle();
    await this.editor.waitForLoading(title);
  }

  async openLockedNote(password: string) {
    if (!(await this.contextMenu.isLocked())) return;

    await this.page
      .locator(".active")
      .locator(getTestId("unlock-note-password"))
      .fill(password);
    await this.page
      .locator(".active")
      .locator(getTestId("unlock-note-submit"))
      .click();

    const title = await this.getTitle();
    await this.editor.waitForLoading(title);
  }

  async isFavorite() {
    await this.locator
      .locator(getTestId("favorite"))
      .waitFor({ state: "visible" });
    return true;
  }

  async getTags() {
    const tags: string[] = [];
    for await (const item of iterateList(
      this.locator.locator(getTestId("tag-item"))
    )) {
      const title = await item.textContent();
      if (title) tags.push(title.replace("#", ""));
    }
    return tags;
  }
}
