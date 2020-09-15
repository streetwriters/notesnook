export function groupBy(arr, key) {
  let groups = {};
  arr.forEach((item) => {
    let groupTitle = key(item);
    let group = groups[groupTitle]
      ? groups[groupTitle]
      : (groups[groupTitle] = []);
    group.push(item);
  });

  let items = [];
  for (let group in groups) {
    items = [...items, { title: group, type: "header" }, ...groups[group]];
  }
  return items;
}

var hexPattern = /([A-F]|[a-f]|\d)*/;
export function isHex(input) {
  if (typeof input !== "string") return false;
  if (!input.match || input.length < 16) return false;
  return input.match(hexPattern)[0] === input;
}
