import "../types";
import fastsort from "fast-sort";
import {
  getWeekGroupFromTimestamp,
  months,
  getLastWeekTimestamp,
  get7DayTimestamp,
} from "./date";

/**
 *
 * @param {GroupOptions} options
 * @returns sort selectors
 */
const getSortSelectors = (options) => [
  { desc: (t) => t.conflicted },
  { desc: (t) => t.pinned },
  { [options.sortDirection]: (item) => item[options.sortBy] },
];

const TIMESTAMPS = {
  recent: () => getLastWeekTimestamp(7),
  lastWeek: () => getLastWeekTimestamp(7) - get7DayTimestamp(), //seven day timestamp value
};

const KEY_SELECTORS = {
  abc: (item) => item.title[0].toUpperCase(),
  month: (item, groupBy) => months[new Date(item[groupBy]).getMonth()],
  week: (item, groupBy) => getWeekGroupFromTimestamp(item[groupBy]),
  year: (item, groupBy) => new Date(item[groupBy]).getFullYear().toString(),
  default: (item, groupBy) =>
    item[groupBy] >= TIMESTAMPS.recent()
      ? "Recent"
      : item[groupBy] >= TIMESTAMPS.lastWeek()
      ? "Last week"
      : "Older",
};

/**
 * @param {any[]} array
 * @param {GroupOptions} options
 * @returns Grouped array
 */
export function groupArray(array, options) {
  const keySelector = KEY_SELECTORS[options.groupId || "default"];
  if (options.sortBy && options.sortDirection)
    fastsort(array).by(getSortSelectors(options));

  let groups = new Map();
  array.forEach((item) => {
    let groupTitle = item.pinned
      ? "Pinned"
      : item.conflicted
      ? "Conflicted"
      : keySelector(item, options.groupBy);

    let group = groups.get(groupTitle) || [];
    group.push(item);
    groups.set(groupTitle, group);
  });

  let items = [];
  groups.forEach((groupItems, groupTitle) => {
    let group = { title: groupTitle, type: "header" };
    items.push(group);
    groupItems.forEach((item) => items.push(item));
  });
  return items;
}
