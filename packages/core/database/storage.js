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

  getAllKeys() {
    return this.storage.getAllKeys();
  }

  encrypt(password, data, compress) {
    return this.storage.encrypt(password, data, compress);
  }

  decrypt(password, cipher) {
    return this.storage.decrypt(password, cipher);
  }

  deriveCryptoKey(name, data) {
    return this.storage.deriveCryptoKey(name, data);
  }

  hash(password, userId) {
    return this.storage.hash(password, userId);
  }

  getCryptoKey(name) {
    return this.storage.getCryptoKey(name);
  }
}
