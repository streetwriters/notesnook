import { tryParse } from "./parse";

function set(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function get(key, def) {
  const value = window.localStorage.getItem(key);
  if (!value) return def;

  return tryParse(value);
}

function clear() {
  window.localStorage.clear();
}

export default { set, get, clear };
