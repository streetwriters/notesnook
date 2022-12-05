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
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isToday from "dayjs/plugin/isToday";
import isTomorrow from "dayjs/plugin/isTomorrow";
import isYesterday from "dayjs/plugin/isYesterday";
import { Reminder } from "../../services/notifications";
import { WeekDayNames } from "../constants";

dayjs.extend(isTomorrow);
dayjs.extend(isYesterday);
dayjs.extend(isToday);
dayjs.extend(isBetween);

function isNext(time: number, type: "week" | "month") {
  console.log(dayjs().endOf(type));
  return (
    dayjs(time).isAfter(dayjs().endOf(type)) &&
    dayjs(time).isBetween(
      dayjs().endOf(type),
      dayjs(dayjs().endOf(type).add(1, "day")).endOf(type)
    )
  );
}

function isLast(time: number, type: "week" | "month") {
  return (
    dayjs(time).isBefore(dayjs().endOf(type)) &&
    dayjs(time).isBetween(dayjs(time).startOf(type), dayjs().startOf(type))
  );
}

function getUpcomingReminderTime(reminder: Reminder) {
  const time = reminder.date;
  const sorted = reminder.selectedDays.sort((a, b) => a - b);
  // If all selected days have passed for current period, i.e week or month
  if (
    dayjs(time)
      .day(sorted[sorted.length - 1])
      .isBefore(dayjs())
  ) {
    // select first selected day of next month/week;
    return dayjs(time)
      .day(sorted[0])
      .add(1, reminder.recurringMode)
      .toDate()
      .getTime();
  }
  // Choose the nearest reminder time
  // If not all selected days have passed yet.
  for (const day of reminder.selectedDays) {
    if (dayjs(time).day(day).isAfter(dayjs())) {
      return dayjs(time).day(day).toDate().getTime();
    }
  }
  return time;
}

export function formatReminderTime(reminder: Reminder) {
  const { date } = reminder;
  let time = date as number;
  if (reminder.mode === "repeat") {
    time = getUpcomingReminderTime(reminder) as number;
  }

  const isPast = dayjs(time).isBefore(dayjs());

  if (dayjs(time).isTomorrow()) {
    return `"Upcoming": Tomorrow, ${dayjs(time).format("hh:mm A")}`;
  }

  if (dayjs(time).isYesterday()) {
    return `Last occurrence: Yesterday, ${dayjs(time).format("hh:mm A")}`;
  }

  if (dayjs(time).isToday()) {
    return `${isPast ? "Last occurrence" : "Upcoming"}: Today, ${dayjs(
      time
    ).format("hh:mm A")}`;
  }

  // if (isNext(time, "week")) {
  //   return `Next ${
  //     WeekDayNames[dayjs(time).day() as keyof typeof WeekDayNames]
  //   }, ${dayjs(time).format("hh:mm A")}`;
  // }

  // if (isLast(time, "week")) {
  //   return `Last ${
  //     WeekDayNames[dayjs(time).day() as keyof typeof WeekDayNames]
  //   }, ${dayjs(time).format("hh:mm A")}`;
  // }

  // if (isNext(time, "month")) {
  //   return `${WeekDayNames[dayjs(time).day() as keyof typeof WeekDayNames]}, ${
  //     dayjs(time).date() + nth(dayjs(time).date())
  //   } of next month, ${dayjs(time).format("hh:mm A")}`;
  // }

  return (
    `${isPast ? "Last occurrence" : "Upcoming"}: ` +
    dayjs(time).format("ddd, DD MMM,YYYY hh:mm A")
  );
}

export const sleep = (duration: number) =>
  new Promise((resolve) => setTimeout(() => resolve(true), duration));

export function timeSince(date: number) {
  const seconds = Math.floor((Date.now() - date) / 1000);
  let interval = Math.floor(seconds / 31536000);

  if (interval > 0.9) {
    return interval < 2 ? interval + "yr ago" : interval + "yr ago";
  }
  interval = Math.floor(seconds / 2592000);
  if (interval > 0.9) {
    return interval < 2 ? interval + "mo ago" : interval + "mo ago";
  }

  interval = Math.floor(seconds / (86400 * 7));
  if (interval > 0.9) {
    if (interval === 4) return "1mo ago";
    return interval < 2 ? interval + "w ago" : interval + "w ago";
  }

  interval = Math.floor(seconds / 86400);
  if (interval > 0.9) {
    return interval < 2 ? interval + "d ago" : interval + "d ago";
  }
  interval = Math.floor(seconds / 3600);
  if (interval > 0.9) {
    return interval < 2 ? interval + "h ago" : interval + "h ago";
  }
  interval = Math.floor(seconds / 60);
  if (interval > 0.9) {
    return interval < 2 ? interval + "m ago" : interval + "m ago";
  }
  return Math.floor(seconds) < 0 ? "0s ago" : Math.floor(seconds) + "s ago";
}

export const timeConverter = (timestamp: number | undefined | null) => {
  if (!timestamp) return;
  const d = new Date(timestamp); // Convert the passed timestamp to milliseconds
  const yyyy = d.getFullYear();
  const dd = ("0" + d.getDate()).slice(-2); // Add leading 0.
  const currentDay = d.getDay();
  const hh = d.getHours();
  let h = hh;
  const min = ("0" + d.getMinutes()).slice(-2); // Add leading 0.
  let ampm = "AM";
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
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

  if (hh > 12) {
    h = hh - 12;
    ampm = "PM";
  } else if (hh === 12) {
    h = 12;
    ampm = "PM";
  } else if (hh === 0) {
    h = 12;
  }

  // ie: 2013-02-18, 8:35 AM
  const time =
    days[currentDay] +
    " " +
    dd +
    " " +
    months[d.getMonth()] +
    ", " +
    yyyy +
    ", " +
    h +
    ":" +
    min +
    " " +
    ampm;

  return time;
};
