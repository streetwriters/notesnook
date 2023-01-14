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
import { Item } from "./models/types";
import {
  groupByOptions,
  NOTEBOOK,
  sortByOptions,
  orderByOptions,
  NOTE
} from "./utils";

test("create shortcut of a topic", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notebooks = await app.goToNotebooks();
  const notebook = await notebooks.createNotebook(NOTEBOOK);
  const topics = await notebook?.openNotebook();
  const topic = await topics?.findItem({ title: NOTEBOOK.topics[0] });

  await topic?.createShortcut();

  expect(await topic?.isShortcut()).toBe(true);
  const allShortcuts = await app.navigation.getShortcuts();
  expect(allShortcuts.includes(NOTEBOOK.topics[0])).toBeTruthy();
});

test("remove shortcut of a topic", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notebooks = await app.goToNotebooks();
  const notebook = await notebooks.createNotebook(NOTEBOOK);
  const topics = await notebook?.openNotebook();
  const topic = await topics?.findItem({ title: NOTEBOOK.topics[0] });
  await topic?.createShortcut();

  await topic?.removeShortcut();

  expect(await topic?.isShortcut()).toBe(false);
  const allShortcuts = await app.navigation.getShortcuts();
  expect(allShortcuts.includes(NOTEBOOK.topics[0])).toBeFalsy();
});

test("delete a topic", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notebooks = await app.goToNotebooks();
  const notebook = await notebooks.createNotebook(NOTEBOOK);
  const topics = await notebook?.openNotebook();
  const topic = await topics?.findItem({ title: NOTEBOOK.topics[0] });

  await topic?.deleteWithNotes();

  expect(await app.toasts.waitForToast("1 topic deleted")).toBe(true);
  expect(await topics?.findItem({ title: NOTEBOOK.topics[0] })).toBeUndefined();
});

test("edit topics individually", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notebooks = await app.goToNotebooks();
  const notebook = await notebooks.createNotebook(NOTEBOOK);
  const topics = await notebook?.openNotebook();

  const editedTopics: Item[] = [];
  for (const title of NOTEBOOK.topics) {
    const topic = await topics?.findItem({ title });
    const editedTopic: Item = { title: `${title} (edited)` };
    await topic?.editItem(editedTopic);
    editedTopics.push(editedTopic);
  }

  for (const topic of editedTopics) {
    expect(await topics?.findItem(topic)).toBeDefined();
  }
});

test("delete all notes within a topic", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notebooks = await app.goToNotebooks();
  const notebook = await notebooks.createNotebook(NOTEBOOK);
  const topics = await notebook?.openNotebook();
  const topic = await topics?.findItem({ title: NOTEBOOK.topics[0] });
  let notes = await topic?.open();
  for (let i = 0; i < 2; ++i) {
    await notes?.createNote({
      title: `Note ${i}`,
      content: NOTE.content
    });
  }
  await app.goBack();

  await topic?.deleteWithNotes(true);

  notes = await app.goToNotes();
  expect(await notes.isEmpty()).toBe(true);
});

test(`sort topics`, async ({ page }, info) => {
  info.setTimeout(2 * 60 * 1000);

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
          const sortResult = await topics?.sort({
            groupBy,
            orderBy,
            sortBy
          });
          if (!sortResult) return;

          expect(await topics?.isEmpty()).toBeFalsy();
        });
      }
    }
  }
});

test("search topics", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notebooks = await app.goToNotebooks();
  const notebook = await notebooks.createNotebook({
    ...NOTEBOOK,
    topics: ["title1", "title2", "title3", "title4", "title5"]
  });
  await notebook?.openNotebook();

  const search = await app.search("1");
  const topic = await search?.findItem({ title: "title1" });

  expect((await topic?.getTitle()) === "title1").toBeTruthy();
});
