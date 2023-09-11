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

import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isToday from "dayjs/plugin/isToday";
import isTomorrow from "dayjs/plugin/isTomorrow";
import isYesterday from "dayjs/plugin/isYesterday";
import { TimeFormat, formatDate } from "../utils/date";
import { getId } from "../utils/id";
import { ICollection } from "./collection";
import { CachedCollection } from "../database/cached-collection";
import { Reminder } from "../types";
import Database from "../api";

dayjs.extend(isTomorrow);
dayjs.extend(isSameOrBefore);
dayjs.extend(isYesterday);
dayjs.extend(isToday);

export class Reminders implements ICollection {
  name = "reminders";
  readonly collection: CachedCollection<"reminders", Reminder>;
  constructor(private readonly db: Database) {
    this.collection = new CachedCollection(
      db.storage,
      "reminders",
      db.eventManager
    );
  }

  async init() {
    await this.collection.init();
  }

  async add(reminder: Partial<Reminder>) {
    if (!reminder) return;
    if (reminder.remote)
      throw new Error("Please use db.reminders.merge to merge reminders.");

    const id = reminder.id || getId();
    const oldReminder = this.collection.get(id);

    reminder = {
      ...oldReminder,
      ...reminder
    };

    if (!reminder.date || !reminder.title)
      throw new Error("date and title are required in a reminder.");

    await this.collection.add({
      id,
      type: "reminder",
      dateCreated: reminder.dateCreated || Date.now(),
      dateModified: reminder.dateModified || Date.now(),
      date: reminder.date,
      description: reminder.description,
      mode: reminder.mode || "once",
      priority: reminder.priority || "vibrate",
      recurringMode: reminder.recurringMode,
      selectedDays: reminder.selectedDays || [],
      title: reminder.title,
      localOnly: reminder.localOnly,
      disabled: reminder.disabled,
      snoozeUntil: reminder.snoozeUntil
    });
    return reminder.id;
  }

  get raw() {
    return this.collection.raw();
  }

  get all() {
    return this.collection.items();
  }

  exists(itemId: string) {
    return this.collection.exists(itemId);
  }

  reminder(id: string) {
    return this.collection.get(id);
  }

  async remove(...reminderIds: string[]) {
    for (const id of reminderIds) {
      await this.collection.remove(id);
    }
  }
}

export function formatReminderTime(
  reminder: Reminder,
  short = false,
  options: { timeFormat: TimeFormat; dateFormat: string } = {
    timeFormat: "12-hour",
    dateFormat: "DD-MM-YYYY"
  }
) {
  const { date } = reminder;
  let time = date;
  let tag = "";
  let text = "";

  if (reminder.mode === "permanent") return `Ongoing`;

  if (reminder.snoozeUntil && reminder.snoozeUntil > Date.now()) {
    return `Snoozed until ${formatDate(reminder.snoozeUntil, {
      timeFormat: options.timeFormat,
      type: "time"
    })}`;
  }

  if (reminder.mode === "repeat") {
    time = getUpcomingReminderTime(reminder);
  }

  const formattedTime = formatDate(time, {
    timeFormat: options.timeFormat,
    type: "time"
  });

  const formattedDateTime = formatDate(time, {
    dateFormat: `ddd, ${options.dateFormat}`,
    timeFormat: options.timeFormat,
    type: "date-time"
  });

  if (dayjs(time).isTomorrow()) {
    tag = "Upcoming";
    text = `Tomorrow, ${formattedTime}`;
  } else if (dayjs(time).isYesterday()) {
    tag = "Last";
    text = `Yesterday, ${formattedTime}`;
  } else {
    const isPast = dayjs(time).isSameOrBefore(dayjs());
    tag = isPast ? "Last" : "Upcoming";
    if (dayjs(time).isToday()) {
      text = `Today, ${formattedTime}`;
    } else {
      text = formattedDateTime;
    }
  }

  return short ? text : `${tag}: ${text}`;
}

export function isReminderToday(reminder: Reminder) {
  const { date } = reminder;
  let time = date;

  if (reminder.mode === "permanent") return true;

  if (reminder.mode === "repeat") {
    time = getUpcomingReminderTime(reminder);
  }

  return dayjs(time).isToday();
}

function getUpcomingReminderTime(reminder: Reminder) {
  if (reminder.mode === "once") return reminder.date;
  // this is only the time (hour & minutes); date is not included
  const time = dayjs(reminder.date);
  const now = dayjs();
  const relativeTime = now.clone().hour(time.hour()).minute(time.minute());

  const isPast = relativeTime.isSameOrBefore(now);

  const isDay = reminder.recurringMode === "day";
  const isWeek = reminder.recurringMode === "week";
  const isMonth = reminder.recurringMode === "month";
  if (isDay) {
    if (isPast) return relativeTime.add(1, "day").valueOf();
    else return relativeTime.valueOf();
  }

  if (!reminder.selectedDays || !reminder.selectedDays.length)
    return relativeTime.valueOf();

  const sorted = reminder.selectedDays.sort((a, b) => a - b);
  const lastSelectedDay = sorted[sorted.length - 1];
  if (isWeek) {
    if (now.day() > lastSelectedDay || isPast)
      return relativeTime.day(sorted[0]).add(1, "week").valueOf();
    else {
      for (const day of reminder.selectedDays)
        if (now.day() <= day) return relativeTime.day(day).valueOf();
    }
  } else if (isMonth) {
    if (now.date() > lastSelectedDay || isPast)
      return relativeTime.date(sorted[0]).add(1, "month").valueOf();
    else {
      for (const day of reminder.selectedDays)
        if (now.date() <= day) return relativeTime.date(day).valueOf();
    }
  }

  return relativeTime.valueOf();
}

export function getUpcomingReminder(reminders: Reminder[]) {
  const sorted = reminders.sort((a, b) => {
    const d1 = a.mode === "repeat" ? getUpcomingReminderTime(a) : a.date;
    const d2 = b.mode === "repeat" ? getUpcomingReminderTime(b) : b.date;
    return !d1 || !d2 ? 0 : d2 - d1;
  });
  return sorted[0];
}

export function isReminderActive(reminder: Reminder) {
  const time =
    reminder.mode === "once"
      ? reminder.date
      : getUpcomingReminderTime(reminder);

  return (
    !reminder.disabled &&
    (reminder.mode !== "once" ||
      time > Date.now() ||
      (reminder.snoozeUntil && reminder.snoozeUntil > Date.now()))
  );
}
