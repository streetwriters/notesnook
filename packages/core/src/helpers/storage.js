import Convert from "../utils/convert";
import IStorage from "../interfaces/IStorage";
import ICipherData from "../interfaces/ICipherData";

export default class Storage {
  storage;
  constructor(context) {
    this.storage = context;
  }
  async write(key, data) {
    await this.storage.write(key, Convert.toString(data));
  }
  async read() {
    let data = await this.storage.read(key);
    return Convert.fromString(data);
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
