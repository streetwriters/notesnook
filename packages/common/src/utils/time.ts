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
import { database } from "../database";
import { formatReminderTime } from "@notesnook/core/collections/reminders";

export function getFormattedDate(
  date: string | number | Date,
  type: "time" | "date-time" | "date" = "date-time"
) {
  return formatDate(date, {
    dateFormat: database.settings?.getDateFormat() as string,
    timeFormat: database.settings?.getTimeFormat() as string,
    type: type
  });
}

export function getFormattedReminderTime(reminder: any, short = false) {
  return formatReminderTime(reminder, short, {
    dateFormat: database.settings?.getDateFormat() as string,
    timeFormat: database.settings?.getTimeFormat() as string
  });
}
