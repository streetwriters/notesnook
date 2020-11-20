export function tryParse(val) {
  if (val === "undefined" || val === "null") return;

  try {
    return JSON.parse(val);
  } catch (e) {
    return val;
  }
}
