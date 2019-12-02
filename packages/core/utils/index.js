export function extractValues(obj) {
  const t = [];
  for (var key in obj) {
    t[t.length] = obj[key];
  }
  return t;
}
