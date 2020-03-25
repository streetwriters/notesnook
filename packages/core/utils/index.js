var tfun = require("transfun/transfun.js").tfun;
if (!tfun) {
  tfun = global.tfun;
}

export function extractValues(obj) {
  const t = [];
  for (let key in obj) {
    t[t.length] = obj[key];
  }
  return t;
}

export function groupBy(arr, key, special = false) {
  if (special) {
    return groupBySpecial(arr, key);
  }
  let retVal = [];
  for (let val of arr) {
    let v = key(val);
    let index = retVal.findIndex(a => a.title === v);
    if (index === -1) {
      index = retVal.length;
      retVal[retVal.length] = {
        title: v,
        data: []
      };
    }
    retVal[index].data.push(val);
  }
  return retVal;
}

function groupBySpecial(arr, key) {
  let retVal = [];
  let _groups = { "": 0 };
  let groups = [];
  let groupCounts = [];
  var i = -1;
  let pinned = [];
  for (let val of arr) {
    if (val.pinned) {
      pinned[pinned.length] = val;
      continue;
    }
    i++;
    let groupTitle = key(val);
    let index =
      _groups[groupTitle] === undefined ? i : _groups[groupTitle].index;
    let groupIndex =
      _groups[groupTitle] == undefined
        ? groupCounts.length
        : _groups[groupTitle].groupIndex;
    retVal.splice(index + 1, 0, val);
    groupCounts[groupIndex] =
      groupCounts.length == groupIndex ? 1 : groupCounts[groupIndex] + 1;
    groups[groupIndex] = { title: groupTitle };
    _groups[groupTitle] = {
      index: i,
      groupIndex
    };
  }

  let g = { items: retVal, groups, groupCounts };
  g.items.splice(0, 0, ...pinned);
  g.groupCounts.splice(0, 0, pinned.length);
  g.groups.splice(0, 0, { title: "Pinned" });
  return g;
}

var hexPattern = /([A-F]|[a-f]|\d)*/;
export function isHex(input) {
  if (typeof input !== "string") return false;
  if (!input.match || input.length < 16) return false;
  return input.match(hexPattern)[0] === input;
}
