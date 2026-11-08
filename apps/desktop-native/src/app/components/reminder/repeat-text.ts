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

import type { Dayjs } from "dayjs";
import { getTimeFormat } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { db } from "../../common/db";

const RecurringModes = {
  WEEK: "week",
  MONTH: "month",
  YEAR: "year",
  DAY: "day"
} as const;
type ValueOf<T> = T[keyof T];

const WEEK_DAYS = [0, 1, 2, 3, 4, 5, 6] as const;
const WEEK_DAYS_MON = [1, 2, 3, 4, 5, 6, 0] as const;

function timeFormat() {
  return getTimeFormat(db.settings.getTimeFormat());
}

export function getWeekDays(weekFormat: string) {
  return (weekFormat === "Sun" ? WEEK_DAYS : WEEK_DAYS_MON).map((day) =>
    strings.weekDayNamesShort[day]()
  );
}

export function getReminderRepeatText(
  recurringMode: ValueOf<typeof RecurringModes>,
  selectedDays: number[],
  date: Dayjs,
  weekDays: string[]
) {
  const time = date.format(timeFormat());

  if (recurringMode === RecurringModes.YEAR) {
    return strings.reminderRepeatStrings.year(
      `${date.format(db.settings.getDateFormat())} at ${time}`
    );
  }

  const repeatsDaily =
    (selectedDays.length === 7 && recurringMode === RecurringModes.WEEK) ||
    (selectedDays.length === 31 && recurringMode === RecurringModes.MONTH) ||
    recurringMode === RecurringModes.DAY;

  if (selectedDays.length === 0 && recurringMode !== RecurringModes.DAY)
    return recurringMode === RecurringModes.WEEK
      ? strings.reminderRepeatStrings.week.selectDays()
      : strings.reminderRepeatStrings.month.selectDays();

  if (repeatsDaily) return strings.reminderRepeatStrings.day(time);

  return strings.reminderRepeatStrings.repeats(
    1,
    recurringMode,
    getSelectedDaysText(selectedDays, recurringMode, weekDays),
    time
  );
}

function getSelectedDaysText(
  selectedDays: number[],
  recurringMode: ValueOf<typeof RecurringModes>,
  weekDays: string[]
) {
  return [...selectedDays]
    .sort((a, b) => a - b)
    .map((day, index) => {
      const isLast = index === selectedDays.length - 1;
      const isSecondLast = index === selectedDays.length - 2;
      const joinWith = isSecondLast ? " & " : isLast ? "" : ", ";
      return recurringMode === RecurringModes.WEEK
        ? weekDays[day] + joinWith
        : `${day}${nth(day)} ${joinWith}`;
    })
    .join("");
}

function nth(n: number) {
  return (
    ["st", "nd", "rd"][(((((n < 0 ? -n : n) + 90) % 100) - 10) % 10) - 1] ||
    "th"
  );
}
