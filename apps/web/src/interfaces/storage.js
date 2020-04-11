import localforage from "localforage";
import { extendPrototype } from "localforage-getitems";
import sort from "fast-sort";

extendPrototype(localforage);

localforage.config({
  name: "Notesnook",
  driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE],
});

function read(key) {
  return localforage.getItem(key);
}

function readMulti(keys) {
  if (keys.length <= 0) return [];
  return localforage.getItems(sort(keys).asc());
}

function write(key, data) {
  return localforage.setItem(key, data);
}

function remove(key) {
  return localforage.removeItem(key);
}

function clear() {
  return localforage.clear();
}

export default {
  read,
  readMulti,
  write,
  remove,
  clear,
};
