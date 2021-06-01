import fastsort from "fast-sort";

export function groupBy(arr, key, sortSelector, sortDirection) {
  if (sortSelector)
    fastsort(arr).by([
      { desc: (t) => t.conflicted },
      { desc: (t) => t.pinned },
      { [sortDirection]: sortSelector },
    ]);

  let groups = new Map();
  arr.forEach((item) => {
    let groupTitle = item.pinned
      ? "Pinned"
      : item.conflicted
      ? "Conflicted"
      : key(item);

    let arr = groups.get(groupTitle) || [];
    arr.push(item);
    groups.set(groupTitle, arr);
  });

  let items = [];
  groups.forEach((groupItems, groupTitle) => {
    let group = { title: groupTitle, type: "header" };
    items.push(group);
    groupItems.forEach((item) => items.push(item));
  });
  return items;
}

var hexPattern = /([A-F]|[a-f]|\d)*/;
export function isHex(input) {
  if (typeof input !== "string") return false;
  if (!input.match || input.length < 16) return false;
  return input.match(hexPattern)[0] === input;
}
