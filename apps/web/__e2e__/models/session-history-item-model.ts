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
import { NotePropertiesModel } from "./note-properties.model";
import { SessionHistoryPreviewModel } from "./session-history-preview-model";

export class SessionHistoryItemModel {
  private readonly title: Locator;
  private readonly page: Page;
  private readonly locked: Locator;
  constructor(
    private readonly properties: NotePropertiesModel,
    private readonly locator: Locator
  ) {
    this.page = locator.page();
    this.title = locator.locator(getTestId("title"));
    this.locked = locator.locator(getTestId("locked"));
  }

  async getTitle() {
    return await this.title.textContent();
  }

  async open() {
    await this.properties.open();
    await this.locator.click();
    return new SessionHistoryPreviewModel(this.locator);
  }

  async isLocked() {
    await this.properties.open();
    const state = await this.locked.isVisible();
    await this.properties.close();
    return state;
  }
}
