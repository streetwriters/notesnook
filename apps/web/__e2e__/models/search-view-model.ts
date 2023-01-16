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
import { BaseViewModel } from "./base-view.model";
import { ItemModel } from "./item.model";
import { Item } from "./types";

export class SearchViewModel extends BaseViewModel {
  constructor(page: Page) {
    super(page, "general");
  }

  async findItem(item: Item) {
    const titleToCompare = item.title;
    for await (const _item of this.iterateItems()) {
      const itemModel = new ItemModel(_item);
      const title = await itemModel.getTitle();
      if (title === titleToCompare) return itemModel;
    }
    return undefined;
  }
}
