function set(key: string, value: any) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function get<T>(key: string, def?: T): T | undefined {
  const value = window.localStorage.getItem(key);
  if (!value) return def;

  return tryParse(value);
}

function clear() {
  window.localStorage.clear();
}

const Config = { set, get, clear };
export default Config;

function tryParse(val: any) {
  if (val === "undefined" || val === "null") return;

  try {
    return JSON.parse(val);
  } catch (e) {
    return val;
  }
}
