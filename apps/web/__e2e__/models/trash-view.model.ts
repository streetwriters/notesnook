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

import { Page } from "@playwright/test";
import { getTestId } from "../utils";
import { BaseViewModel } from "./base-view.model";
import { TrashItemModel } from "./trash-item.model";

export class TrashViewModel extends BaseViewModel {
  constructor(page: Page) {
    super(page, "trash");
  }

  async findItem(title: string) {
    for await (const item of this.iterateItems()) {
      if ((await item.locator(getTestId("title")).textContent()) === title)
        return new TrashItemModel(item);
    }
    return undefined;
  }
}
