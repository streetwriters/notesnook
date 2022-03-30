import "../types";
import fastsort from "fast-sort";
import dayjs from "dayjs";
import { getWeekGroupFromTimestamp } from "./date";

/**
 *
 * @param {GroupOptions} options
 * @returns sort selectors
 */
const getSortSelectors = (options) => [
  { desc: (t) => t.conflicted },
  { desc: (t) => t.pinned },
  {
    [options.sortDirection]: (item) => {
      if (options.sortBy === "title") return item.alias || item.title;
      return item[options.sortBy];
    },
  },
];

const KEY_SELECTORS = {
  abc: (item) => getFirstCharacter(item.alias || item.title),
  month: (item, groupBy) => dayjs(item[groupBy]).format("MMMM"),
  week: (item, groupBy) => getWeekGroupFromTimestamp(item[groupBy]),
  year: (item, groupBy) => dayjs(item[groupBy]).year(),
  default: (item, groupBy) => {
    const date = dayjs(item[groupBy]);
    return date.isAfter(dayjs().subtract(1, "week"))
      ? "Recent"
      : date.isAfter(dayjs().subtract(2, "weeks"))
      ? "Last week"
      : "Older";
  },
};

/**
 * @param {any[]} array
 * @param {GroupOptions} options
 * @returns Grouped array
 */
export function groupArray(
  array,
  options = {
    groupBy: "default",
    sortBy: "dateEdited",
    sortDirection: "desc",
  }
) {
  const keySelector = KEY_SELECTORS[options.groupBy || "default"];
  if (options.sortBy && options.sortDirection)
    fastsort(array).by(getSortSelectors(options));

  let groups = new Map();
  array.forEach((item) => {
    let groupTitle = item.pinned
      ? "Pinned"
      : item.conflicted
      ? "Conflicted"
      : keySelector(item, options.sortBy);

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

function getFirstCharacter(str) {
  if (!str) return "-";
  str = str.trim();
  if (str.length <= 0) return "-";
  return str[0].toUpperCase();
}
