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

import { formatDate } from "@notesnook/common";

type DayFormat = "short" | "long";

export function replaceDateTime(
  value: string,
  dateFormat = "DD-MM-YYYY",
  timeFormat: "12-hour" | "24-hour" = "12-hour",
  dayFormat: DayFormat = "short"
) {
  value = value.replaceAll(
    "/time ",
    formatDate(Date.now(), {
      timeFormat,
      type: "time"
    }) + " "
  );

  value = value.replaceAll(
    "/date ",
    formatDate(Date.now(), {
      dateFormat,
      type: "date"
    }) + " "
  );

  value = value.replaceAll(
    "/now ",
    formatDate(Date.now(), {
      dateFormat,
      timeFormat,
      type: "date-time"
    }) + " "
  );

  value = value.replaceAll(
    "/nowz ",
    formatDate(Date.now(), {
      dateFormat,
      timeFormat,
      type: "date-time-timezone"
    }) + " "
  );

  value = value.replaceAll(
    "/day ",
    formatDate(Date.now(), {
      dayFormat: dayFormat,
      type: "day"
    }) + " "
  );

  return value;
}
