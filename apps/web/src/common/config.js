function set(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function get(key, def) {
  const value = window.localStorage.getItem(key);
  if (!value) return def;
  return JSON.parse(value);
}

export default { set, get };
