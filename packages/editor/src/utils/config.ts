function set<T>(key: string, value: T | null) {
  if (!value) return window.localStorage.removeItem(key);
  window.localStorage.setItem(key, JSON.stringify(value));
}

function get<T>(key: string, def?: T): T | undefined {
  const value = window.localStorage.getItem(key);
  if (!value) return def;

  return tryParse(value) as T;
}

export const config = { set, get };

function tryParse<T>(val: string): T | string | undefined {
  if (val === "undefined" || val === "null") return;

  try {
    return JSON.parse(val);
  } catch (e) {
    return val;
  }
}
