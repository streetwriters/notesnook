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
  const topicList: ItemModel[] = [];

  return { topics, app, topicList: topicList.reverse() };
}

test.setTimeout(100 * 1000);

test.only("sorting topics", async ({ page }) => {
  const { topics } = await populateList(page);

  //extra
  await topics?.sort(
    {
      groupBy: "abc",
      orderBy: "ascendingOrder",
      sortBy: "dateCreated"
    },
    true
  );
  //ascending descending order
  await topics?.sort(
    {
      groupBy: "abc",
      orderBy: "ascendingOrder",
      sortBy: "dateCreated"
    },
    true
  );
  expect(await isLengthCorrect(topics)).toBeTruthy();
  console.log("62");
  await topics?.sort(
    {
      groupBy: "abc",
      orderBy: "descendingOrder",
      sortBy: "dateCreated"
    },
    true
  );
  expect(await isLengthCorrect(topics)).toBeTruthy();
  await topics?.sort(
    {
      groupBy: "default",
      orderBy: "ascendingOrder",
      sortBy: "dateCreated"
    },
    true
  );
  expect(await isLengthCorrect(topics)).toBeTruthy();
  await topics?.sort(
    {
      groupBy: "default",
      orderBy: "descendingOrder",
      sortBy: "dateCreated"
    },
    true
  );
  expect(await isLengthCorrect(topics)).toBeTruthy();
  await topics?.sort(
    {
      groupBy: "month",
      orderBy: "ascendingOrder",
      sortBy: "dateCreated"
    },
    true
  );
  expect(await isLengthCorrect(topics)).toBeTruthy();
  await topics?.sort(
    {
      groupBy: "month",
      orderBy: "descendingOrder",
      sortBy: "dateCreated"
    },
    true
  );
  expect(await isLengthCorrect(topics)).toBeTruthy();
  await topics?.sort(
    {
      groupBy: "none",
      orderBy: "ascendingOrder",
      sortBy: "dateCreated"
    },
    true
  );
  expect(await isLengthCorrect(topics)).toBeTruthy();
  await topics?.sort(
    {
      groupBy: "none",
      orderBy: "descendingOrder",
      sortBy: "dateCreated"
    },
    true
  );
  expect(await isLengthCorrect(topics)).toBeTruthy();
  await topics?.sort(
    {
      groupBy: "week",
      orderBy: "ascendingOrder",
      sortBy: "dateCreated"
    },
    true
  );
  expect(await isLengthCorrect(topics)).toBeTruthy();
  await topics?.sort(
    {
      groupBy: "week",
      orderBy: "descendingOrder",
      sortBy: "dateCreated"
    },
    true
  );
  expect(await isLengthCorrect(topics)).toBeTruthy();
  await topics?.sort(
    {
      groupBy: "year",
      orderBy: "ascendingOrder",
      sortBy: "dateCreated"
    },
    true
  );
  expect(await isLengthCorrect(topics)).toBeTruthy();
  await topics?.sort(
    {
      groupBy: "year",
      orderBy: "descendingOrder",
      sortBy: "dateCreated"
    },
    true
  );
  expect(await isLengthCorrect(topics)).toBeTruthy();

  //dateEdited
  await topics?.sort(
    {
      groupBy: "abc",
      orderBy: "ascendingOrder",
      sortBy: "dateEdited"
    },
    true
  );
  expect(await isLengthCorrect(topics)).toBeTruthy();
  await topics?.sort(
    {
      groupBy: "abc",
      orderBy: "descendingOrder",
      sortBy: "dateEdited"
    },
    true
  );
  expect(await isLengthCorrect(topics)).toBeTruthy();
  await topics?.sort(
    {
      groupBy: "default",
      orderBy: "ascendingOrder",
      sortBy: "dateEdited"
    },
    true
  );
  expect(await isLengthCorrect(topics)).toBeTruthy();
  await topics?.sort(
    {
      groupBy: "default",
      orderBy: "descendingOrder",
      sortBy: "dateEdited"
    },
    true
  );
  expect(await isLengthCorrect(topics)).toBeTruthy();
  await topics?.sort(
    {
      groupBy: "month",
      orderBy: "ascendingOrder",
      sortBy: "dateEdited"
    },
    true
  );
  expect(await isLengthCorrect(topics)).toBeTruthy();
  await topics?.sort(
    {
      groupBy: "month",
      orderBy: "descendingOrder",
      sortBy: "dateEdited"
    },
    true
  );
  expect(await isLengthCorrect(topics)).toBeTruthy();
  await topics?.sort(
    {
      groupBy: "none",
      orderBy: "ascendingOrder",
      sortBy: "dateEdited"
    },
    true
  );
  expect(await isLengthCorrect(topics)).toBeTruthy();
  await topics?.sort(
    {
      groupBy: "none",
      orderBy: "descendingOrder",
      sortBy: "dateEdited"
    },
    true
  );
  expect(await isLengthCorrect(topics)).toBeTruthy();
  await topics?.sort(
    {
      groupBy: "week",
      orderBy: "ascendingOrder",
      sortBy: "dateEdited"
    },
    true
  );
  expect(await isLengthCorrect(topics)).toBeTruthy();
  await topics?.sort(
    {
      groupBy: "week",
      orderBy: "descendingOrder",
      sortBy: "dateEdited"
    },
    true
  );
  expect(await isLengthCorrect(topics)).toBeTruthy();
  await topics?.sort(
    {
      groupBy: "year",
      orderBy: "ascendingOrder",
      sortBy: "dateEdited"
    },
    true
  );
  expect(await isLengthCorrect(topics)).toBeTruthy();
  await topics?.sort(
    {
      groupBy: "year",
      orderBy: "descendingOrder",
      sortBy: "dateEdited"
    },
    true
  );
  expect(await isLengthCorrect(topics)).toBeTruthy();
});

async function isLengthCorrect(topics: ItemsViewModel | undefined) {
  let itemCount = (await topics?.getList())?.length;
  if (itemCount !== 5) return false;
  return true;
}
