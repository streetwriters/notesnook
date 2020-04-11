export default class Storage {
  constructor(context) {
    this.storage = context;
  }
  write(key, data) {
    return this.storage.write(key, data);
  }
  readMulti(keys) {
    return this.storage.readMulti(keys);
  }
  read(key, isArray = false) {
    return this.storage.read(key, isArray);
  }
  clear() {
    return this.storage.clear();
  }
  remove(key) {
    return this.storage.remove(key);
  }
}
