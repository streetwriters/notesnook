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

import { Locator, Page } from "@playwright/test";
import { getTestId } from "../utils";
import { Item, Notebook } from "./types";

export async function* iterateList(list: Locator) {
  const count = await list.count();
  for (let i = 0; i < count; ++i) {
    yield list.nth(i);
  }
  return null;
}

export async function fillNotebookDialog(
  page: Page,
  notebook: Notebook,
  editing = false
) {
  const titleInput = page.locator(getTestId("title-input"));
  const descriptionInput = page.locator(getTestId("description-input"));
  const topicInput = page.locator(getTestId(`edit-topic-input`));
  const topicInputAction = page.locator(getTestId(`edit-topic-action`));

  await titleInput.waitFor({ state: "visible" });

  await titleInput.fill(notebook.title);
  if (notebook.description) await descriptionInput.fill(notebook.description);

  const topicItems = page.locator(getTestId("topic-item"));
  for (let i = 0; i < notebook.topics.length; ++i) {
    if (editing) {
      const topicItem = topicItems.nth(i);
      await topicItem.click();
    }
    await topicInput.fill(notebook.topics[i]);
    await topicInputAction.click();
  }

  await confirmDialog(page);
}

export async function fillMoveTopicDialog(page: Page, notebookTitle: string) {
  const notebookList = page.locator(getTestId("notebook-list"));
  const notebookTitles = notebookList.locator(getTestId("title"));
  const dialogConfirm = page.locator(getTestId("dialog-yes"));
  for await (const title of iterateList(notebookTitles)) {
    if (notebookTitle === (await title.textContent())) {
      await title.click();
    }
  }
  await confirmDialog(page);
}

export async function fillItemDialog(page: Page, item: Item) {
  const titleInput = page.locator(getTestId("title-input"));
  await titleInput.waitFor({ state: "visible" });

  await titleInput.fill(item.title);

  await confirmDialog(page);
}

export async function fillPasswordDialog(page: Page, password: string) {
  await page.locator(getTestId("dialog-password")).fill(password);
  await confirmDialog(page);
}

export async function confirmDialog(page: Page) {
  const dialogConfirm = page.locator(getTestId("dialog-yes"));
  await dialogConfirm.click();
  // await dialogConfirm.waitFor({ state: "detached" });
}

export async function waitToHaveText(page: Page, id: string) {
  await page.waitForFunction(
    ({ id }) => {
      return (
        (document.querySelector(`[data-test-id="${id}"]`)?.textContent
          ?.length || 0) > 0
      );
    },
    { id }
  );
}
