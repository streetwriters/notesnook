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

import type { Locator, Page } from "@playwright/test";
import { getTestId } from "../utils";

export class NoteLinkingDialogModel {
  private readonly dialog: Locator;
  private readonly searchInput: Locator;
  private readonly createNoteButton: Locator;

  constructor(page: Page) {
    this.dialog = page.locator(getTestId("note-linking-dialog"));
    this.searchInput = this.dialog.locator(getTestId("link-note-search"));
    this.createNoteButton = this.dialog.locator(getTestId("create-linked-note"));
  }

  async waitFor() {
    await this.dialog.waitFor({ state: "visible" });
  }

  async waitForClose() {
    await this.dialog.waitFor({ state: "hidden" });
  }

  async search(query: string) {
    await this.searchInput.fill(query);
  }

  async isCreateNoteVisible() {
    return this.createNoteButton.isVisible();
  }

  async createNote() {
    await this.createNoteButton.click();
    await this.waitForClose();
  }
}
