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
import { BaseViewModel } from "./base-view.model";
import { NotebookItemModel } from "./notebook-item.model";
import { Notebook } from "./types";
import { fillNotebookDialog } from "./utils";

export class SubnotebooksViewModel extends BaseViewModel {
  private readonly createButton: Locator;

  constructor(readonly page: Page) {
    super(page, "subnotebooks", "subnotebooks");
    this.createButton = page
      .locator(getTestId("subnotebooks-action-button"))
      .first();
  }

  async createNotebook(notebook: Notebook) {
    await this.createButton.click();

    await fillNotebookDialog(this.page, notebook);

    await this.waitForItem(notebook.title);
    return await this.findNotebook(notebook);
  }

  async findNotebook(notebook: Partial<Notebook>) {
    for await (const item of this.iterateItems()) {
      const notebookModel = new NotebookItemModel(item);
      if ((await notebookModel.getTitle()) === notebook.title)
        return notebookModel;
    }
    return undefined;
  }
}
