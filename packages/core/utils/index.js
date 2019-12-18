var tfun = require("transfun/transfun.js").tfun;
tfun = global.tfun;

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
  let _groups = {};
  let groups = [];
  let groupCounts = [];
  var i = -1;
  for (let val of arr) {
    i++;
    let k = key(val);
    let index = _groups[k] === undefined ? i : _groups[k].index;
    let groupIndex =
      _groups[k] == undefined ? groupCounts.length : _groups[k].groupIndex;
    retVal.splice(index, 0, val);
    groupCounts[groupIndex] =
      groupCounts.length == groupIndex ? 1 : groupCounts[groupIndex] + 1;
    groups[groupIndex] = { title: k };
    _groups[k] = {
      index: i,
      groupIndex
    };
  }
  return { items: retVal, groups, groupCounts };
}
