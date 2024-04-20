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

export class SessionHistoryPreviewModel {
  private readonly page: Page;
  private readonly diffViewer: Locator;
  readonly firstEditor: Locator;
  readonly secondEditor: Locator;
  private readonly restoreButton: Locator;
  constructor(locator: Locator) {
    this.page = locator.page();
    this.diffViewer = this.page.locator(`.active${getTestId("diff-viewer")}`);
    this.firstEditor = this.diffViewer.locator(getTestId("first-editor"));
    this.secondEditor = this.diffViewer.locator(getTestId("second-editor"));
    this.restoreButton = this.diffViewer.locator(getTestId("restore-session"));
  }

  async unlock(password: string) {
    await this.diffViewer.waitFor();

    if (password) {
      await this.firstEditor
        .locator(getTestId("unlock-note-password"))
        .fill(password);
      await this.firstEditor.locator(getTestId("unlock-note-submit")).click();

      await this.secondEditor
        .locator(getTestId("unlock-note-password"))
        .fill(password);
      await this.secondEditor.locator(getTestId("unlock-note-submit")).click();
    }
  }

  async restore() {
    await this.diffViewer.waitFor();
    await this.restoreButton.click();
  }
}
