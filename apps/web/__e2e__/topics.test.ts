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
import { getTestId, NOTE } from "./utils";

test.only("Move topic to notebook", async ({ page }) => {
  const NOTEBOOK1 = {
    title: "Test notebook 1",
    description: "This is test notebook 1",
    topics: ["Topic 1", "Very long topic 2", "Topic 3"]
  };
  const NOTEBOOK2 = {
    title: "Test notebook 2",
    description: "This is test notebook 2",
    topics: ["Topic 4", "Very long topic 5", "Topic 6"]
  };

  const app = new AppModel(page);
  await app.goto();
  const notebooks = await app.goToNotebooks();
  const notebook1 = await notebooks.createNotebook(NOTEBOOK1);
  const notebook2 = await notebooks.createNotebook(NOTEBOOK2);

  const topics = await notebook1?.openNotebook();
  const topic = await topics?.findItem({ title: NOTEBOOK1.topics[0] });
  await topic?.moveItem(NOTEBOOK2.title);

  await page.locator(getTestId("go-back")).click();
  const topics2 = await notebook2?.openNotebook();
  const topic2 = await topics2?.findItem({ title: NOTEBOOK1.topics[0] });

  expect((await topic2?.getTitle()) === NOTEBOOK1.topics[0]).toBeTruthy();
});
