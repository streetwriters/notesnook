import { tryParse } from "./parse";

function set<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function get<T>(key: string, def?: T) {
  const value = window.localStorage.getItem(key);
  if (!value) return def;

  return tryParse(value);
}

function clear() {
  window.localStorage.clear();
}

function all(): Record<string, any> {
  const data: Record<string, any> = {};
  for (let i = 0; i < window.localStorage.length; ++i) {
    const key = window.localStorage.key(i);
    if (!key) continue;
    data[key] = get(key);
  }
  return data;
}

function has(predicate: (key: string) => boolean) {
  for (let i = 0; i < window.localStorage.length; ++i) {
    const key = window.localStorage.key(i);
    if (!key) continue;
    if (predicate(key)) return true;
  }
  return false;
}

const Config = { set, get, clear, all, has };
export default Config;
