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
  read(key) {
    return this.storage.read(key);
  }
  clear() {
    return this.storage.clear();
  }
  remove(key) {
    return this.storage.remove(key);
  }
  encrypt(password, data) {
    return this.storage.encrypt(password, data);
  }
  decrypt(password, cipher) {
    return this.storage.decrypt(password, cipher);
  }
}
