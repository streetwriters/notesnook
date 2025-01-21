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
import advancedFormat from "dayjs/plugin/advancedFormat.js";
import timezone from "dayjs/plugin/timezone.js";
import { TimeFormat } from "../types.js";

dayjs.extend(advancedFormat);
dayjs.extend(timezone);

export function getWeekGroupFromTimestamp(timestamp: number) {
  const date = new Date(timestamp);
  const { start, end } = getWeek(date);

  const startMonth =
    start.month !== end.month ? " " + MONTHS_SHORT[start.month] : "";
  const startYear = start.year !== end.year ? ", " + start.year : "";

  const startDate = `${start.day}${startMonth}${startYear}`;
  const endDate = `${end.day} ${MONTHS_SHORT[end.month]}, ${end.year}`;

  return `${startDate} - ${endDate}`;
}

const MS_IN_HOUR = 3600000;
function getWeek(date: Date) {
  const day = date.getDay() || 7;
  if (day !== 1) {
    const hours = 24 * (day - 1);
    date.setTime(date.getTime() - MS_IN_HOUR * hours);
  }
  const start = {
    month: date.getMonth(),
    year: date.getFullYear(),
    day: date.getDate()
  };

  const hours = 24 * 6;
  date.setTime(date.getTime() + MS_IN_HOUR * hours);

  const end = {
    month: date.getMonth(),
    year: date.getFullYear(),
    day: date.getDate()
  };

  return { start, end };
}

export function getTimeFormat(format: TimeFormat) {
  return format === "12-hour" ? "hh:mm A" : "HH:mm";
}

export type TimeZoneOptions = {
  type: "timezone";
};
export type TimeOptions = {
  type: "time";
  timeFormat: TimeFormat;
};
export type DateOptions = {
  type: "date";
  dateFormat: string;
};
export type DateTimeOptions = {
  type: "date-time";
  dateFormat: string;
  timeFormat: TimeFormat;
};
export type DateTimeWithTimeZoneOptions = {
  type: "date-time-timezone";
  dateFormat: string;
  timeFormat: TimeFormat;
};
export type FormatDateOptions =
  | TimeZoneOptions
  | TimeOptions
  | DateOptions
  | DateTimeOptions
  | DateTimeWithTimeZoneOptions;

export function formatDate(
  date: string | number | Date | null | undefined,
  options: FormatDateOptions = {
    dateFormat: "DD-MM-YYYY",
    timeFormat: "12-hour",
    type: "date-time"
  }
) {
  switch (options.type) {
    case "date-time-timezone":
      return dayjs(date).format(
        `${options.dateFormat} ${getTimeFormat(options.timeFormat)} z`
      );
    case "date-time":
      return dayjs(date).format(
        `${options.dateFormat} ${getTimeFormat(options.timeFormat)}`
      );
    case "time":
      return dayjs(date).format(getTimeFormat(options.timeFormat));
    case "date":
      return dayjs(date).format(options.dateFormat);
    case "timezone":
      return dayjs(date).format("ZZ");
  }
}

export const MONTHS_FULL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];
