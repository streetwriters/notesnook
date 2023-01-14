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

import { Reminder } from "@notesnook/core/collections/reminders";
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

export async function fillReminderDialog(
  page: Page,
  reminder: Partial<Reminder>
) {
  const titleInput = page.locator(getTestId("title-input"));
  const descriptionInput = page.locator(getTestId("description-input"));
  const dateInput = page.locator(getTestId("date-input"));
  const timeInput = page.locator(getTestId("time-input"));

  if (reminder.title) {
    await titleInput.waitFor({ state: "visible" });
    await titleInput.fill(reminder.title);
  }
  if (reminder.description) await descriptionInput.fill(reminder.description);
  if (reminder.mode)
    await page.locator(getTestId(`mode-${reminder.mode}`)).click();

  if (reminder.priority)
    await page.locator(getTestId(`priority-${reminder.priority}`)).click();

  if (reminder.recurringMode && reminder.mode === "repeat") {
    await page
      .locator(getTestId(`recurring-mode-${reminder.recurringMode}`))
      .click();

    if (
      reminder.selectedDays &&
      reminder.selectedDays.length > 0 &&
      reminder.recurringMode !== "day"
    ) {
      for (const day of reminder.selectedDays) {
        await page.locator(getTestId(`day-${day}`)).click();
      }
    }
  }

  if (reminder.date) {
    const date = new Date(Date.now() + reminder.date);
    if (reminder.mode === "once") {
      await dateInput.fill(
        `${date.getFullYear()}-${(date.getMonth() + 1)
          .toString()
          .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`
      );
    }

    const time = `${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    await timeInput.fill(time);
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

export async function denyDialog(page: Page) {
  const dialogConfirm = page.locator(getTestId("dialog-no"));
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
