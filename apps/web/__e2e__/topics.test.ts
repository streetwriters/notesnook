import { Sort } from "./models/base-view.model";
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

import { test, expect, Page } from "@playwright/test";
import { AppModel } from "./models/app.model";
import { ItemModel } from "./models/item.model";
import { ItemsViewModel } from "./models/items-view.model";
import { NOTEBOOK } from "./utils";

async function populateList(page: Page) {
  const app = new AppModel(page);
  await app.goto();
  const notebooks = await app.goToNotebooks();
  NOTEBOOK.topics = ["title1", "title2", "title3", "title4", "title5"];
  const notebook = await notebooks.createNotebook(NOTEBOOK);
  const topics = await notebook?.openNotebook();

  return { topics, app };
}

test.setTimeout(100 * 1000);

test("sorting topics", async ({ page }) => {
  const { topics } = await populateList(page);

  const orderBy: Sort["orderBy"][] = ["ascendingOrder", "descendingOrder"];
  const sortBy: Sort["sortBy"][] = ["dateCreated", "dateEdited"];
  const groupBy: Sort["groupBy"][] = [
    "abc",
    "none",
    "default",
    "year",
    "month",
    "week"
  ];

  for (let group of groupBy) {
    for (let sort of sortBy) {
      for (let order of orderBy) {
        await topics?.sort({
          groupBy: group,
          orderBy: order,
          sortBy: sort
        });
        expect(await topics?.isItemListFilled()).toBeTruthy();
      }
    }
  }
});
