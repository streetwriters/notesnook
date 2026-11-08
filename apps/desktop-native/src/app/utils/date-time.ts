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
import { db } from "../common/db";
import { getTimeFormat } from "@notesnook/core";

export function setTimeOnly(str: string, date: dayjs.Dayjs) {
  const value = dayjs(str, getTimeFormat(db.settings.getTimeFormat()), true);
  return date.hour(value.hour()).minute(value.minute());
}

export function setDateOnly(str: string, date: dayjs.Dayjs) {
  const value = dayjs(str, db.settings.getDateFormat(), true);
  return date.year(value.year()).month(value.month()).date(value.date());
}
