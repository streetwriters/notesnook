export function objectMap(obj, fn) {
  return Object.entries(obj).map(([k, v], i) => fn(k, v, i));
}
