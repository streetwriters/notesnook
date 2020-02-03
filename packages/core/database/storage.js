export default class Storage {
  constructor(context) {
    this.storage = context;
  }
  async write(key, data) {
    await this.storage.write(key, data);
  }
  async read(key) {
    let data = await this.storage.read(key);
    return data;
  }
  clear() {
    this.storage.clear();
  }
  remove(key) {
    this.storage.remove(key);
  }
  encrypt(password, data) {
    return this.storage.encrypt(password, data);
  }
  decrypt(password, cipher) {
    return this.storage.decrypt(password, cipher);
  }
}
