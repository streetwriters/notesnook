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

import getId from "../utils/id";
import Collection from "./collection";

/**
 * @typedef {{
 *  id: string;
 *  type: string;
 *  title: string;
 *  description?: string;
 *  priority: "silent" | "vibrate" | "urgent";
 *  date: number;
 *  mode: "repeat" | "once" | "permanent";
 *  recurringMode?: "week" | "month" | "day";
 *  selectedDays?: number[];
 *  dateCreated: number;
 *  dateModified: number;
 *  localOnly: boolean;
 * }} Reminder
 *
 */

export default class Reminders extends Collection {
  async merge(reminder) {
    if (!reminder) return;
    await this._collection.addItem(reminder);
  }

  /**
   *
   * @param {Partial<Reminder>} reminder
   * @returns
   */
  async add(reminder) {
    if (!reminder) return;
    if (reminder.remote)
      throw new Error("Please use db.reminders.merge to merge reminders.");

    const id = reminder.id || getId();
    let oldReminder = this._collection.getItem(id);

    reminder = {
      ...oldReminder,
      ...reminder
    };

    reminder = {
      id,
      type: "reminder",
      dateCreated: reminder.dateCreated,
      dateModified: reminder.dateModified,
      date: reminder.date,
      description: reminder.description,
      mode: reminder.mode || "once",
      priority: reminder.priority || "vibrate",
      recurringMode: reminder.recurringMode,
      selectedDays: reminder.selectedDays || [],
      title: reminder.title,
      localOnly: reminder.localOnly
    };

    await this._collection.addItem(reminder);
    return reminder.id;
  }

  get raw() {
    return this._collection.getRaw();
  }

  /**
   * @return {Reminder[]}
   */
  get all() {
    return this._collection.getItems();
  }

  exists(itemId) {
    return !!this.shortcut(itemId);
  }

  reminder(id) {
    return this.all.find((reminder) => reminder.id === id);
  }

  async remove(...reminderIds) {
    for (const id of reminderIds) {
      await this._collection.removeItem(id);
    }
  }
}
