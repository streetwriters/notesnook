export function extractValues(obj) {
  const t = [];
  for (let key in obj) {
    t[t.length] = obj[key];
  }
  return t;
}
