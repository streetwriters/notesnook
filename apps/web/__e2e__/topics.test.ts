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

import { test, expect } from "@playwright/test";
import { AppModel } from "./models/app.model";
import {
  groupByOptions,
  NOTEBOOK,
  sortByOptions,
  orderByOptions
} from "./utils";

test(`sort topics`, async ({ page }, info) => {
  info.setTimeout(60 * 1000);

  const app = new AppModel(page);
  await app.goto();
  const notebooks = await app.goToNotebooks();
  const notebook = await notebooks.createNotebook({
    ...NOTEBOOK,
    topics: ["title1", "title2", "title3", "title4", "title5"]
  });
  const topics = await notebook?.openNotebook();

  for (const groupBy of groupByOptions) {
    for (const sortBy of sortByOptions) {
      for (const orderBy of orderByOptions) {
        await test.step(`group by ${groupBy}, sort by ${sortBy}, order by ${orderBy}`, async () => {
          await topics?.sort({
            groupBy,
            orderBy,
            sortBy
          });
          expect(await topics?.isEmpty()).toBeFalsy();
        });
      }
    }
  }
});
