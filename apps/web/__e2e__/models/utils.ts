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

import { Reminder } from "@notesnook/core";
import { Locator, Page } from "@playwright/test";
import { getTestId } from "../utils";
import { Color, Item, Notebook } from "./types";
import dayjs from "dayjs";

export async function* iterateList(list: Locator) {
  const count = await list.count();
  for (let i = 0; i < count; ++i) {
    yield list.nth(i);
  }
  return null;
}

export async function fillNotebookDialog(page: Page, notebook: Notebook) {
  const dialog = page.locator(getTestId("add-notebook-dialog"));
  const titleInput = dialog.locator(getTestId("title-input"));
  const descriptionInput = dialog.locator(getTestId("description-input"));

  await titleInput.waitFor({ state: "visible" });

  await titleInput.fill(notebook.title);
  if (notebook.description) await descriptionInput.fill(notebook.description);

  await confirmDialog(dialog);
}

export async function fillReminderDialog(
  page: Page,
  reminder: Partial<Reminder>
) {
  const dialog = page.locator(getTestId("add-reminder-dialog"));
  const titleInput = dialog.locator(getTestId("title-input"));
  const descriptionInput = dialog.locator(getTestId("description-input"));
  const dateInput = dialog.locator(getTestId("date-input"));
  const timeInput = dialog.locator(getTestId("time-input"));

  if (reminder.title) {
    await titleInput.waitFor({ state: "visible" });
    await titleInput.fill(reminder.title);
  }
  if (reminder.description) await descriptionInput.fill(reminder.description);
  if (reminder.mode)
    await dialog.locator(getTestId(`mode-${reminder.mode}`)).click();

  if (reminder.priority)
    await dialog.locator(getTestId(`priority-${reminder.priority}`)).click();

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
        await dialog.locator(getTestId(`day-${day}`)).click();
      }
    }
  }

  if (reminder.date) {
    const date = new Date(Date.now() + reminder.date);
    if (reminder.mode === "once") {
      await dateInput.fill(dayjs(date).format("DD-MM-YYYY"));
    }

    await timeInput.fill(dayjs(date).format("hh:mm A"));
  }

  await confirmDialog(dialog);
}

export async function fillItemDialog(page: Page, item: Item) {
  const dialog = page.locator(getTestId("item-dialog"));
  const titleInput = dialog.locator(getTestId("title-input"));
  await titleInput.waitFor({ state: "visible" });

  await titleInput.fill(item.title);

  await confirmDialog(dialog);
}

export async function fillColorDialog(page: Page, item: Color) {
  const dialog = page.locator(getTestId("new-color-dialog"));

  const titleInput = dialog.locator(getTestId("title-input"));
  await titleInput.waitFor({ state: "visible" });
  await titleInput.fill(item.title);

  const colorInput = dialog.locator(getTestId("color-input"));
  await colorInput.waitFor({ state: "visible" });
  await colorInput.fill(item.color);

  await confirmDialog(dialog);
}

export async function fillPasswordDialog(page: Page, password: string) {
  const dialog = page.locator(getTestId("password-dialog"));
  await dialog.locator(getTestId("password")).fill(password);
  await confirmDialog(dialog);
}

export async function fillConfirmPasswordDialog(page: Page, password: string) {
  const dialog = page.locator(getTestId("password-dialog"));
  await dialog.locator(getTestId("password")).fill(password);
  await dialog.locator(getTestId("confirmPassword")).fill(password);
  await confirmDialog(dialog);
}

export async function confirmDialog(dialog: Locator) {
  const dialogConfirm = dialog.locator(getTestId("dialog-yes"));
  await dialogConfirm.click();
  // await dialogConfirm.waitFor({ state: "detached" });
}

export async function denyDialog(page: Page) {
  const dialogConfirm = page.locator(getTestId("dialog-no"));
  await dialogConfirm.click();
  // await dialogConfirm.waitFor({ state: "detached" });
}

export async function waitForDialog(page: Page, title: string) {
  const dialogTitle = page
    .locator(getTestId("dialog-title"))
    .filter({ hasText: title });
  await dialogTitle.waitFor({ state: "attached" });
  await dialogTitle.waitFor({ state: "detached" });
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
