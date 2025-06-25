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

import { isReminderActive } from "../collections/reminders.js";
import {
  GroupHeader,
  GroupOptions,
  ItemType,
  Reminder,
  SortOptions
} from "../types.js";
import { getWeekGroupFromTimestamp, MONTHS_FULL } from "../utils/date.js";

type PartialGroupableItem = {
  id: string;
  type?: ItemType | null;
  dateDeleted?: number | null;
  title?: string | null;
  filename?: string | null;
  dateEdited?: number | null;
  dateCreated?: number | null;
};
export type GroupKeySelectorFunction<T> = (item: T) => string;

export const getSortValue = (
  options: SortOptions | undefined,
  item: PartialGroupableItem
) => {
  if (
    options?.sortBy === "dateDeleted" &&
    "dateDeleted" in item &&
    item.dateDeleted
  )
    return item.dateDeleted;
  else if (
    options?.sortBy === "dateEdited" &&
    "dateEdited" in item &&
    item.dateEdited
  )
    return item.dateEdited;

  return item.dateCreated || 0;
};

export function getSortSelectors<T extends PartialGroupableItem>(
  options: SortOptions
) {
  if (options.sortBy === "title")
    return {
      asc: (a: T, b: T) =>
        getTitle(a).localeCompare(getTitle(b), undefined, { numeric: true }),
      desc: (a: T, b: T) =>
        getTitle(b).localeCompare(getTitle(a), undefined, { numeric: true })
    };

  return {
    asc: (a: T, b: T) => getSortValue(options, a) - getSortValue(options, b),
    desc: (a: T, b: T) => getSortValue(options, b) - getSortValue(options, a)
  };
}

const MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24;
const MILLISECONDS_IN_WEEK = MILLISECONDS_IN_DAY * 7;

export function createKeySelector(
  options: GroupOptions = {
    groupBy: "default",
    sortBy: "dateEdited",
    sortDirection: "desc"
  }
): GroupKeySelectorFunction<PartialGroupableItem> {
  return (item) => {
    if ("pinned" in item && item.pinned) return "Pinned";
    else if ("conflicted" in item && item.conflicted) return "Conflicted";

    const date = new Date();
    if (item.type === "reminder")
      return isReminderActive(item as Reminder) ? "Active" : "Inactive";
    else if (options.groupBy === "abc")
      return getFirstCharacter(getTitle(item));
    else {
      const value = getSortValue(options, item) || 0;
      switch (options.groupBy) {
        case "none":
          return "All";
        case "month":
          date.setTime(value);
          return `${MONTHS_FULL[date.getMonth()]} ${date.getFullYear()}`;
        case "week":
          return getWeekGroupFromTimestamp(value);
        case "year":
          date.setTime(value);
          return date.getFullYear().toString();
        case "default":
        default: {
          return value > date.getTime() - MILLISECONDS_IN_WEEK
            ? "Recent"
            : value > date.getTime() - MILLISECONDS_IN_WEEK * 2
            ? "Last week"
            : "Older";
        }
      }
    }
  };
}

export function groupArray<T>(
  items: T[],
  keySelector: GroupKeySelectorFunction<T>
): Map<number, { index: number; group: GroupHeader }> {
  const groups = new Map<
    string,
    [number, { index: number; group: GroupHeader }]
  >();

  for (let i = 0; i < items.length; ++i) {
    const item = items[i];
    const groupTitle = keySelector(item);
    const group = groups.get(groupTitle);
    if (typeof group === "undefined")
      groups.set(groupTitle, [
        i,
        {
          index: i,
          group: { id: groupTitle, title: groupTitle, type: "header" }
        }
      ]);
  }
  return new Map(groups.values());
}

function getFirstCharacter(str: string) {
  if (!str) return "-";
  str = str.trim();
  if (str.length <= 0) return "-";
  return str[0].toUpperCase();
}

function getTitle(item: PartialGroupableItem): string {
  return ("filename" in item ? item.filename : item.title) || "Unknown";
}
