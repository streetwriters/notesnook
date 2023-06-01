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

import { formatDate } from "@notesnook/core/utils/date";
import { db } from "../../common/database";
import { formatReminderTime } from "@notesnook/core/collections/reminders";

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

export function getFormattedDate(
  date: any,
  type: "time" | "date-time" | "date" = "date-time"
) {
  return formatDate(date, {
    dateFormat: db.settings?.getDateFormat() as string,
    timeFormat: db.settings?.getTimeFormat() as string,
    type: type
  });
}

export function getFormattedReminderTime(reminder: any, short = false) {
  return formatReminderTime(reminder, short, {
    dateFormat: db.settings?.getDateFormat() as string,
    timeFormat: db.settings?.getTimeFormat() as string
  });
}
