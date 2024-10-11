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

import { database } from "../database.js";
import {
  TimeFormat,
  formatReminderTime,
  HistorySession,
  Reminder,
  FormatDateOptions,
  formatDate
} from "@notesnook/core";

export function getFormattedDate(
  date: string | number | Date,
  type: FormatDateOptions["type"] = "date-time"
) {
  return formatDate(date, {
    dateFormat: database.settings?.getDateFormat() as string,
    timeFormat: database.settings?.getTimeFormat() as string,
    type: type
  } as FormatDateOptions);
}

export function getFormattedReminderTime(reminder: Reminder, short = false) {
  return formatReminderTime(reminder, short, {
    dateFormat: database.settings?.getDateFormat() as string,
    timeFormat: database.settings?.getTimeFormat() as TimeFormat
  });
}

export function getFormattedHistorySessionDate(session: HistorySession) {
  const fromDate = getFormattedDate(session.dateCreated, "date");
  const toDate = getFormattedDate(session.dateModified, "date");
  const fromTime = getFormattedDate(session.dateCreated, "time");
  const toTime = getFormattedDate(session.dateModified, "time");
  return `${fromDate}, ${fromTime} — ${
    fromDate !== toDate ? `${toDate}, ` : ""
  }${toTime}`;
}

export { formatDate };
