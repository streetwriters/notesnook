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

import { Locator, Page } from "@playwright/test";
import { getTestId } from "../utils";
import { BaseViewModel } from "./base-view.model";
import { ReminderItemModel } from "./reminder-item.model";
import { Reminder } from "@notesnook/core";
import { fillReminderDialog } from "./utils";

export class RemindersViewModel extends BaseViewModel {
  private readonly createButton: Locator;

  constructor(page: Page) {
    super(page, "reminders", "reminders");
    this.createButton = page
      .locator(getTestId("reminders-action-button"))
      .first();
  }

  async createReminder(reminder: Partial<Reminder>) {
    await this.createButton.click();

    await fillReminderDialog(this.page, reminder);
  }

  async createReminderAndWait(reminder: Partial<Reminder>) {
    await this.createReminder(reminder);

    if (reminder.title) await this.waitForItem(reminder.title);
    return await this.findReminder(reminder);
  }

  async findReminder(reminder: Partial<Reminder>) {
    for await (const item of this.iterateItems()) {
      const reminderModel = new ReminderItemModel(item);
      if ((await reminderModel.getTitle()) === reminder.title)
        return reminderModel;
    }
    return undefined;
  }
}
