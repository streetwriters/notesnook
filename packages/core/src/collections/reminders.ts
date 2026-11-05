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
import { getId, makeId } from "../utils/id.js";
import { ICollection } from "./collection.js";
import { Reminder, TimeFormat } from "../types.js";
import Database from "../api/index.js";
import { SQLCollection } from "../database/sql-collection.js";
import { isFalse } from "../database/index.js";
import { sql } from "@streetwriters/kysely";
import { strings } from "@notesnook/intl";

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
      snoozeUntil: reminder.snoozeUntil,
      completedAt: reminder.completedAt
    });
    return id;
  }

  /**
   * Completes a reminder. For a repeating reminder, this completes its
   * current occurrence (the first one on or after `reminder.date`), records
   * it as a completed one-time reminder, and moves `reminder.date` to the
   * next occurrence, even if that is still in the past.
   *
   * @param occurrence a specific occurrence to complete instead (e.g. the one
   * a notification was shown for). Occurrences before it are skipped.
   */
  async markComplete(id: string, occurrence?: number) {
    const reminder = await this.collection.get(id);
    if (!reminder) return;
    if (reminder.mode === "permanent") return;

    if (reminder.mode === "once") {
      if (reminder.completedAt)
        throw new Error("Reminder is already completed.");

      return this.add({
        id,
        completedAt: Date.now(),
        snoozeUntil: undefined
      });
    }

    const current = getUpcomingReminderTime(reminder, reminder.date - 1);
    if (occurrence === undefined) occurrence = current;
    else if (occurrence < current)
      throw new Error("Reminder occurrence is already completed.");
    else if (getUpcomingReminderTime(reminder, occurrence - 1) !== occurrence)
      throw new Error("Invalid reminder occurrence.");

    // create a duplicate completed "once" reminder. The id is derived from the
    // occurrence so retrying after a partial failure doesn't duplicate it.
    const duplicateId = makeId(`${id}${occurrence}`);
    await this.add({
      id: duplicateId,
      type: "reminder",
      dateCreated: Date.now(),
      dateModified: Date.now(),
      date: occurrence,
      description: reminder.description,
      mode: "once",
      priority: reminder.priority,
      title: reminder.title,
      localOnly: reminder.localOnly,
      completedAt: Date.now()
    });

    const relations = await this.db.relations
      .to({ id, type: "reminder" })
      .get();
    for (const relation of relations) {
      await this.db.relations.add(
        { id: relation.fromId, type: relation.fromType },
        { id: duplicateId, type: "reminder" }
      );
    }

    await this.add({
      id,
      date: getUpcomingReminderTime(reminder, occurrence),
      snoozeUntil: undefined
    });
  }

  async markUncomplete(id: string) {
    const reminder = await this.collection.get(id);
    if (!reminder) return;
    if (reminder.mode === "permanent") return;
    if (reminder.mode === "repeat") {
      throw new Error("Cannot mark a repeating reminder as uncomplete.");
    }

    return this.add({
      id,
      completedAt: undefined
    });
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

  if (reminder.mode === "permanent") return strings.ongoing();

  if (reminder.snoozeUntil && reminder.snoozeUntil > Date.now()) {
    return strings.snoozedUntil(
      formatDate(reminder.snoozeUntil, {
        timeFormat: options.timeFormat,
        type: "time"
      })
    );
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

  let isPast = false;
  let text = "";

  if (dayjs(time).isTomorrow()) {
    isPast = false;
    text = strings.reminderTomorrow(formattedTime);
  } else if (dayjs(time).isYesterday()) {
    isPast = true;
    text = strings.reminderYesterday(formattedTime);
  } else {
    isPast = dayjs(time).isSameOrBefore(dayjs());
    if (dayjs(time).isToday()) {
      text = strings.reminderToday(formattedTime);
    } else {
      text = formattedDateTime;
    }
  }

  if (short) return text;
  return isPast ? strings.reminderLast(text) : strings.reminderUpcoming(text);
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

export function getUpcomingReminderTime(reminder: Reminder, from?: number) {
  if (reminder.mode === "once") return reminder.date;

  /**
   * Never look for occurrences before the reminder's start date. The 1ms
   * offset keeps the start moment itself eligible as the first occurrence.
   */
  const now = dayjs(Math.max(from ?? Date.now(), reminder.date - 1));
  const today = now.startOf("day");
  // time of day at which the reminder fires
  const time = dayjs(reminder.date);
  const at = (date: dayjs.Dayjs) =>
    date
      .hour(time.hour())
      .minute(time.minute())
      .second(time.second())
      .millisecond(0);
  const isPastToday = at(today).isSameOrBefore(now);
  // earliest date on which the reminder can still fire
  const fromDate = isPastToday ? today.add(1, "day") : today;

  // selected day of the month starting at `monthStart`, clamped to
  // the last day of that month (e.g. 31st in April becomes the 30th)
  const selectedDayOfMonth = (monthStart: dayjs.Dayjs, day: number) =>
    monthStart.date(Math.min(day, monthStart.daysInMonth()));

  const selectedDays = reminder.selectedDays || [];
  let date: dayjs.Dayjs | undefined;
  switch (reminder.recurringMode) {
    case "day":
      date = fromDate;
      break;
    case "week":
      date = earliest(
        selectedDays.map((day) => {
          const candidate = fromDate.day(day);
          return candidate.isBefore(fromDate)
            ? candidate.add(1, "week")
            : candidate;
        })
      );
      break;
    case "month": {
      const thisMonth = today.startOf("month");
      const nextMonth = thisMonth.add(1, "month");
      date = earliest(
        selectedDays.map((day) => {
          const candidate = selectedDayOfMonth(thisMonth, day);
          return candidate.isBefore(fromDate)
            ? selectedDayOfMonth(nextMonth, day)
            : candidate;
        })
      );
      break;
    }
    case "year": {
      const thisYear = today
        .startOf("year")
        .month(time.month())
        .date(time.date());
      date = thisYear.isBefore(fromDate) ? thisYear.add(1, "year") : thisYear;
      break;
    }
  }

  return at(date || today).valueOf();
}

function earliest(dates: dayjs.Dayjs[]) {
  return dates.reduce<dayjs.Dayjs | undefined>(
    (min, date) => (!min || date.isBefore(min) ? date : min),
    undefined
  );
}

function getReminderTriggerTime(reminder: Reminder) {
  if (reminder.snoozeUntil && reminder.snoozeUntil > Date.now())
    return reminder.snoozeUntil;
  return reminder.mode === "repeat"
    ? getUpcomingReminderTime(reminder)
    : reminder.date;
}

/**
 * Returns the reminder that will trigger next, preferring enabled reminders
 * over disabled ones. Past & completed reminders are never returned.
 */
export function getUpcomingReminder(reminders: Reminder[]) {
  let upcoming:
    | { reminder: Reminder; active: boolean; time: number }
    | undefined;
  const now = Date.now();
  for (const reminder of reminders) {
    if (reminder.completedAt) continue;

    const time = getReminderTriggerTime(reminder);
    if (reminder.mode === "once" && time <= now) continue;

    const active = !reminder.disabled;
    if (
      !upcoming ||
      (active && !upcoming.active) ||
      (active === upcoming.active && time < upcoming.time)
    )
      upcoming = { reminder, active, time };
  }
  return upcoming?.reminder;
}

export type ReminderGroup = "Upcoming" | "Past" | "Disabled" | "Completed";

export function getReminderGroup(reminder: Reminder): ReminderGroup {
  if (reminder.completedAt) return "Completed";
  if (reminder.disabled) return "Disabled";
  if (
    reminder.mode !== "once" ||
    reminder.date > Date.now() ||
    (!!reminder.snoozeUntil && reminder.snoozeUntil > Date.now())
  ) {
    return "Upcoming";
  }
  return "Past";
}

export function isReminderActive(reminder: Reminder) {
  return getReminderGroup(reminder) === "Upcoming";
}

export function createUpcomingReminderTimeQuery(unix = "now") {
  // mirrors getUpcomingReminderTime: never search before the start date.
  const start = sql`max(datetime(${unix}), datetime(date / 1000 - 1, 'unixepoch'))`;
  const now = sql`datetime(${start}, 'localtime')`;
  const today = sql`date(${start}, 'localtime')`;
  // time of day at which the reminder fires
  const time = sql`time(date / 1000, 'unixepoch', 'localtime')`;
  const isPastToday = sql`datetime(${today}, ${time}) <= ${now}`;
  // earliest date on which the reminder can still fire
  const fromDate = sql`date(${today}, IIF(${isPastToday}, '+1 day', '+0 day'))`;

  // selected day of the month starting at `monthStart`, clamped to
  // the last day of that month (e.g. 31st in April becomes the 30th)
  const selectedDayOfMonth = (monthStart: typeof today) =>
    sql`date(${monthStart}, '+' || (MIN(value, CAST(strftime('%d', ${monthStart}, '+1 month', '-1 day') AS INTEGER)) - 1) || ' days')`;
  const thisMonthDay = selectedDayOfMonth(
    sql`date(${today}, 'start of month')`
  );
  const nextMonthDay = selectedDayOfMonth(
    sql`date(${today}, 'start of month', '+1 month')`
  );

  const thisYearDate = sql`strftime('%Y-', ${today}) || strftime('%m-%d', date / 1000, 'unixepoch', 'localtime')`;

  // 'weekday N' moves forward to the next date that is weekday N
  // (or stays put if the date is already weekday N)
  const weekly = sql`(SELECT MIN(date(${fromDate}, 'weekday ' || value)) FROM json_each(selectedDays))`;
  const monthly = sql`(SELECT MIN(IIF(${thisMonthDay} >= ${fromDate}, ${thisMonthDay}, ${nextMonthDay})) FROM json_each(selectedDays))`;
  const yearly = sql`IIF(date(${thisYearDate}) >= ${fromDate}, date(${thisYearDate}), date(${thisYearDate}, '+1 year'))`;

  return sql`CASE
        WHEN mode = 'once' THEN date / 1000 * 1000
        ELSE strftime('%s',
            COALESCE(
                CASE recurringMode
                    WHEN 'day' THEN ${fromDate}
                    WHEN 'week' THEN ${weekly}
                    WHEN 'month' THEN ${monthly}
                    WHEN 'year' THEN ${yearly}
                END,
                ${today}
            ),
            ${time},
            'utc'
        ) * 1000
    END
`.$castTo<number>();
}

/**
 * Mirrors getReminderGroup:
 * 0 = Upcoming
 * 1 = Past
 * 2 = Disabled
 * 3 = Completed
 * */
export function createReminderGroupQuery(now = "now") {
  return sql`CASE
    WHEN completedAt IS NOT NULL THEN 3
    WHEN disabled IS NOT NULL AND disabled = 1 THEN 2
    WHEN mode != 'once'
      OR datetime(date / 1000, 'unixepoch', 'localtime') > datetime(${now}, 'localtime')
      OR (snoozeUntil IS NOT NULL
        AND datetime(snoozeUntil / 1000, 'unixepoch', 'localtime') > datetime(${now}, 'localtime'))
    THEN 0
    ELSE 1
  END`.$castTo<number>();
}

export function createIsReminderActiveQuery(now = "now") {
  return sql`IIF(
    completedAt IS NULL
    AND (disabled IS NULL OR disabled = 0)
    AND (mode != 'once'
      OR datetime(date / 1000, 'unixepoch', 'localtime') > datetime(${now}, 'localtime')
      OR (snoozeUntil IS NOT NULL
        AND datetime(snoozeUntil / 1000, 'unixepoch', 'localtime') > datetime(${now}, 'localtime'))
    ), 1, 0)`.$castTo<boolean>();
}
