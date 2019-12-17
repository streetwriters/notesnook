var tfun = require("transfun/transfun.js").tfun;
tfun = global.tfun;

export function extractValues(obj) {
  const t = [];
  for (let key in obj) {
    t[t.length] = obj[key];
  }
  return t;
}

export function groupBy(arr, key) {
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
