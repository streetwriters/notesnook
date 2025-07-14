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
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js";
import isToday from "dayjs/plugin/isToday.js";
import isTomorrow from "dayjs/plugin/isTomorrow.js";
import isYesterday from "dayjs/plugin/isYesterday.js";
import { formatDate } from "../utils/date.js";
import { getId } from "../utils/id.js";
import { ICollection } from "./collection.js";
import { Reminder, TimeFormat } from "../types.js";
import Database from "../api/index.js";
import { SQLCollection } from "../database/sql-collection.js";
import { isFalse } from "../database/index.js";
import { sql } from "@streetwriters/kysely";

dayjs.extend(isTomorrow);
dayjs.extend(isSameOrBefore);
dayjs.extend(isYesterday);
dayjs.extend(isToday);

export class Reminders implements ICollection {
  name = "reminders";
  readonly collection: SQLCollection<"reminders", Reminder>;
  constructor(private readonly db: Database) {
    this.collection = new SQLCollection(
      db.sql,
      db.transaction,
      "reminders",
      db.eventManager,
      db.sanitizer
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
    const oldReminder = await this.collection.get(id);

    reminder = {
      ...oldReminder,
      ...reminder
    };

    if (!reminder.date || !reminder.title)
      throw new Error(`date and title are required in a reminder.`);

    await this.collection.upsert({
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
    return id;
  }

  // get raw() {
  //   return this.collection.raw();
  // }

  get all() {
    return this.collection.createFilter<Reminder>(
      (qb) => qb.where(isFalse("deleted")),
      this.db.options?.batchSize
    );
  }

  get active() {
    return this.collection.createFilter<Reminder>(
      (qb) =>
        qb
          .where(isFalse("deleted"))
          .where((eb) => eb.parens(createIsReminderActiveQuery())),
      this.db.options?.batchSize
    );
  }

  exists(itemId: string) {
    return this.collection.exists(itemId);
  }

  reminder(id: string) {
    return this.collection.get(id);
  }

  async remove(...reminderIds: string[]) {
    await this.collection.softDelete(reminderIds);
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

export function getUpcomingReminderTime(reminder: Reminder) {
  if (reminder.mode === "once") return reminder.date;

  const isDay = reminder.recurringMode === "day";
  const isWeek = reminder.recurringMode === "week";
  const isMonth = reminder.recurringMode === "month";
  const isYear = reminder.recurringMode === "year";

  // this is only the time (hour & minutes) unless it is a
  // yearly reminder
  const time = dayjs(reminder.date);
  const now = dayjs();
  const relativeTime = isYear
    ? now
        .clone()
        .hour(time.hour())
        .minute(time.minute())
        .month(time.month())
        .date(time.date())
    : now.clone().hour(time.hour()).minute(time.minute());

  const isPast = relativeTime.isSameOrBefore(now);

  if (isYear) {
    if (isPast) return relativeTime.add(1, "year").valueOf();
    else return relativeTime.valueOf();
  }

  if (isDay) {
    if (isPast) return relativeTime.add(1, "day").valueOf();
    else return relativeTime.valueOf();
  }

  if (!reminder.selectedDays || !reminder.selectedDays.length)
    return relativeTime.valueOf();

  const sorted = reminder.selectedDays.sort((a, b) => a - b);
  const lastSelectedDay = sorted[sorted.length - 1];
  if (isWeek) {
    if (
      now.day() > lastSelectedDay ||
      (now.day() === lastSelectedDay && isPast)
    )
      return relativeTime.day(sorted[0]).add(1, "week").valueOf();
    else {
      for (const selectedDay of sorted) {
        if (selectedDay > now.day() || (selectedDay === now.day() && !isPast))
          return relativeTime.day(selectedDay).valueOf();
      }
    }
  } else if (isMonth) {
    if (
      now.date() > lastSelectedDay ||
      (now.date() === lastSelectedDay && isPast)
    )
      return relativeTime.date(sorted[0]).add(1, "month").valueOf();
    else {
      for (const selectedDay of sorted) {
        if (selectedDay > now.date() || (now.date() === selectedDay && !isPast))
          return relativeTime.date(selectedDay).valueOf();
      }
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
  return (
    !reminder.disabled &&
    (reminder.mode !== "once" ||
      reminder.date > Date.now() ||
      (!!reminder.snoozeUntil && reminder.snoozeUntil > Date.now()))
  );
}

export function createUpcomingReminderTimeQuery(unix = "now") {
  const time = sql`time(date / 1000, 'unixepoch', 'localtime')`;
  const dateNow = sql`date(${unix})`;
  const dateTime = sql`datetime(${dateNow} || ${time})`;
  const dateTimeNow = sql`datetime(${unix})`;
  const weekDayNow = sql`CAST(strftime('%w', ${dateNow}) AS INTEGER)`;
  const monthDayNow = sql`CAST(strftime('%d', ${dateNow}) AS INTEGER)`;
  const lastSelectedDay = sql`(SELECT MAX(value) FROM json_each(selectedDays))`;

  const monthDate = sql`strftime('%m-%d%H:%M', date / 1000, 'unixepoch', 'localtime')`;
  return sql`CASE
        WHEN mode = 'once' THEN date / 1000
        WHEN recurringMode = 'year' THEN
            strftime('%s',
                strftime('%Y-', ${dateNow}) || ${monthDate},
                IIF(datetime(strftime('%Y-', ${dateNow}) || ${monthDate}) <= ${dateTimeNow}, '+1 year', '+0 year'),
                'utc'
            )
        WHEN recurringMode = 'day' THEN
            strftime('%s',
                ${dateNow} || ${time},
                IIF(${dateTime} <= ${dateTimeNow}, '+1 day', '+0 day'),
                'utc'
            )
        WHEN recurringMode = 'week' AND selectedDays IS NOT NULL AND json_array_length(selectedDays) > 0 THEN
            CASE
                WHEN ${weekDayNow} > ${lastSelectedDay}
                OR (${weekDayNow} == ${lastSelectedDay} AND ${dateTime} <= ${dateTimeNow})
                THEN
                    strftime('%s', datetime(${dateNow}, ${time}, '+1 day', 'weekday ' || json_extract(selectedDays, '$[0]'), 'utc'))
                ELSE
                    strftime('%s', datetime(${dateNow}, ${time}, 'weekday ' || (SELECT value FROM json_each(selectedDays) WHERE value > ${weekDayNow} OR (value == ${weekDayNow} AND ${dateTime} > ${dateTimeNow})), 'utc'))
            END
        WHEN recurringMode = 'month' AND selectedDays IS NOT NULL AND json_array_length(selectedDays) > 0 THEN
            CASE
                WHEN ${monthDayNow} > ${lastSelectedDay}
                OR (${monthDayNow} == ${lastSelectedDay} AND datetime(${dateNow} || ${time}) <= ${dateTimeNow})
                THEN
                    strftime('%s', strftime('%Y-%m-', ${dateNow}) || printf('%02d', json_extract(selectedDays, '$[0]')) || ${time}, '+1 month', 'utc')
                ELSE strftime('%s', strftime('%Y-%m-', ${dateNow}) || (SELECT printf('%02d', value) FROM json_each(selectedDays) WHERE value > ${monthDayNow} OR (value == ${monthDayNow} AND ${dateTime} > ${dateTimeNow})) || ${time}, 'utc')
            END
        ELSE strftime('%s', ${dateNow} || ${time}, 'utc')
    END * 1000
`.$castTo<number>();
}

export function createIsReminderActiveQuery(now = "now") {
  return sql`IIF(
    (disabled IS NULL OR disabled = 0)
    AND (mode != 'once'
      OR datetime(date / 1000, 'unixepoch', 'localtime') > datetime(${now})
      OR (snoozeUntil IS NOT NULL
        AND datetime(snoozeUntil / 1000, 'unixepoch', 'localtime') > datetime(${now}))
    ), 1, 0)`.$castTo<boolean>();
}
