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

import { isReminderActive } from "../collections/reminders";
import { GroupOptions, Item } from "../types";
import { getWeekGroupFromTimestamp, MONTHS_FULL } from "./date";
import { VirtualizedGroupHeader } from "./virtualized-grouping";

type EvaluateKeyFunction<T> = (item: T) => string;

export const getSortValue = <T extends Item>(
  options: GroupOptions,
  item: T
) => {
  if (
    options.sortBy === "dateDeleted" &&
    "dateDeleted" in item &&
    item.dateDeleted
  )
    return item.dateDeleted;
  else if (options.sortBy === "dateEdited" && "dateEdited" in item)
    return item.dateEdited;

  return item.dateCreated;
};

const MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24;
const MILLISECONDS_IN_WEEK = MILLISECONDS_IN_DAY * 7;

function getKeySelector(options: GroupOptions): EvaluateKeyFunction<Item> {
  return (item: Item) => {
    if ("pinned" in item && item.pinned) return "Pinned";
    else if ("conflicted" in item && item.conflicted) return "Conflicted";

    const date = new Date();
    if (item.type === "reminder")
      return isReminderActive(item) ? "Active" : "Inactive";
    else if (options.sortBy === "title")
      return getFirstCharacter(getTitle(item));
    else {
      const value = getSortValue(options, item);
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

export function groupArray(
  ids: string[],
  items: Record<string, Item>,
  options: GroupOptions = {
    groupBy: "default",
    sortBy: "dateEdited",
    sortDirection: "desc"
  }
): VirtualizedGroupHeader[] {
  const groups = new Map<string, VirtualizedGroupHeader>([
    ["Conflicted", { title: "Conflicted", id: "" }],
    ["Pinned", { title: "Pinned", id: "" }],
    ["Active", { title: "Active", id: "" }],
    ["Inactive", { title: "Inactive", id: "" }]
  ]);

  const keySelector = getKeySelector(options);
  for (const id of ids) {
    const item = items[id];
    if (!item) continue;

    const groupTitle = keySelector(item);
    const group = groups.get(groupTitle) || {
      title: groupTitle,
      id: ""
    };
    if (group.id === "") group.id = id;
    groups.set(groupTitle, group);
  }

  return Array.from(groups.values());
}

function getFirstCharacter(str: string) {
  if (!str) return "-";
  str = str.trim();
  if (str.length <= 0) return "-";
  return str[0].toUpperCase();
}

function getTitle(item: Item): string {
  return item.type === "attachment"
    ? item.filename
    : "title" in item
    ? item.title
    : "Unknown";
}
