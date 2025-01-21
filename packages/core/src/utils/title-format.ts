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

import { TimeFormat } from "../types.js";
import { formatDate } from "./date.js";

export const NEWLINE_STRIP_REGEX = /[\r\n\t\v]+/gm;

const DATE_REGEX = /\$date\$/g;
const COUNT_REGEX = /\$count\$/g;
const TIME_REGEX = /\$time\$/g;
const HEADLINE_REGEX = /\$headline\$/g;
const TIMESTAMP_REGEX = /\$timestamp\$/g;
const TIMESTAMP_Z_REGEX = /\$timestampz\$/g;
const DATE_TIME_STRIP_REGEX = /[\\\-:./, ]/g;

export function formatTitle(
  titleFormat: string,
  dateFormat: string,
  timeFormat: TimeFormat,
  headline = "",
  totalNotes = 0
) {
  const date = formatDate(Date.now(), {
    dateFormat,
    type: "date"
  });

  const time = formatDate(Date.now(), {
    timeFormat,
    type: "time"
  });
  const timezone = formatDate(Date.now(), {
    type: "timezone"
  });
  const timestamp = `${date}${time}`.replace(DATE_TIME_STRIP_REGEX, "");
  const timestampWithTimeZone = `${timestamp}${timezone}`;

  return titleFormat
    .replace(NEWLINE_STRIP_REGEX, " ")
    .replace(DATE_REGEX, date)
    .replace(TIME_REGEX, time)
    .replace(HEADLINE_REGEX, headline || "")
    .replace(TIMESTAMP_REGEX, timestamp)
    .replace(TIMESTAMP_Z_REGEX, timestampWithTimeZone)
    .replace(COUNT_REGEX, `${totalNotes + 1}`);
}
