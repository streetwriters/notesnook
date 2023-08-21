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
import { GroupHeader, GroupOptions, GroupableItem, Reminder } from "../types";
import { getWeekGroupFromTimestamp, MONTHS_FULL } from "./date";

type EvaluateKeyFunction<T> = (item: T) => string;
type GroupedItems<T> = (T | GroupHeader)[];

const getSortValue = <T extends GroupableItem>(
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

function getSortSelectors<T extends GroupableItem>(options: GroupOptions) {
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

function getKeySelector<T extends GroupableItem>(
  options: GroupOptions
): EvaluateKeyFunction<T> {
  return (item: T) => {
    if ("pinned" in item && item.pinned) return "Pinned";
    else if ("conflicted" in item && item.conflicted) return "Conflicted";

    const date = new Date();
    if (options.sortBy === "title") return getFirstCharacter(getTitle(item));
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

export function groupArray<T extends GroupableItem>(
  array: T[],
  options: GroupOptions = {
    groupBy: "default",
    sortBy: "dateEdited",
    sortDirection: "desc"
  }
): GroupedItems<T> {
  if (options.sortBy && options.sortDirection) {
    const selector = getSortSelectors(options)[options.sortDirection];
    array.sort(selector);
  }

  if (options.groupBy === "none") {
    const conflicted: T[] = [];
    const pinned: T[] = [];
    const others: T[] = [];
    for (const item of array) {
      if ("pinned" in item && item.pinned) {
        pinned.push(item);
        continue;
      } else if ("conflicted" in item && item.conflicted) {
        conflicted.push(item);
        continue;
      } else others.push(item);
    }
    const groups: GroupedItems<T> = [];
    if (conflicted.length > 0)
      groups.push({ title: "Conflicted", type: "header" }, ...conflicted);
    if (pinned.length > 0)
      groups.push({ title: "Pinned", type: "header" }, ...pinned);
    if (others.length > 0)
      groups.push({ title: "All", type: "header" }, ...others);
    return groups;
  }

  const groups = new Map<string, T[]>([
    ["Conflicted", []],
    ["Pinned", []]
  ]);

  const keySelector = getKeySelector(options);
  array.forEach((item) => addToGroup(groups, keySelector(item), item));

  return flattenGroups(groups);
}

export function groupReminders(array: Reminder[]): GroupedItems<Reminder> {
  const groups = new Map([
    ["Active", []],
    ["Inactive", []]
  ]);

  array.forEach((item) => {
    const groupTitle = isReminderActive(item) ? "Active" : "Inactive";
    addToGroup(groups, groupTitle, item);
  });

  return flattenGroups(groups);
}

function addToGroup<T extends GroupableItem>(
  groups: Map<string, T[]>,
  groupTitle: string,
  item: T
) {
  const group = groups.get(groupTitle) || [];
  group.push(item);
  groups.set(groupTitle, group);
}

function getFirstCharacter(str: string) {
  if (!str) return "-";
  str = str.trim();
  if (str.length <= 0) return "-";
  return str[0].toUpperCase();
}

function getTitle<T extends GroupableItem>(item: T): string {
  return item.type === "attachment" ? item.metadata.filename : item.title;
}

function flattenGroups<T extends GroupableItem>(groups: Map<string, T[]>) {
  const items: GroupedItems<T> = [];
  groups.forEach((groupItems, groupTitle) => {
    if (groupItems.length <= 0) return;
    items.push({
      title: groupTitle,
      type: "header"
    });
    groupItems.forEach((item) => items.push(item));
  });

  return items;
}
