function set(key, value) {
    if (!value)
        return window.localStorage.removeItem(key);
    window.localStorage.setItem(key, JSON.stringify(value));
}
function get(key, def) {
    const value = window.localStorage.getItem(key);
    if (!value)
        return def;
    return tryParse(value);
}
export const config = { set, get };
function tryParse(val) {
    if (val === "undefined" || val === "null")
        return;
    try {
        return JSON.parse(val);
    }
    catch (e) {
        return val;
    }
}
