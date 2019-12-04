import Convert from "../utils/convert";

class Storage {
  constructor(context) {
    this.storage = context;
  }
  async write(key, data) {
    await this.storage.write(key, Convert.toString(data));
  }
  async read(key) {
    let data = await this.storage.read(key);
    return Convert.fromString(data);
  }
  clear() {
    this.storage.clear(); //TODO add test
  }
  remove(key) {
    this.storage.remove(key); //TODO add test
  }
}

export default Storage;
