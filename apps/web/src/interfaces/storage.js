async function read(key) {
  return new Promise((resolve, reject) =>
    resolve(window.localStorage.getItem(key))
  );
}
async function write(key, data) {
  return new Promise((resolve, reject) =>
    resolve(window.localStorage.setItem(key, data))
  );
}
function remove(key) {
  window.localStorage.removeItem(key);
}
function clear() {
  window.localStorage.clear();
}

module.exports = {
  read,
  write,
  remove,
  clear
};
