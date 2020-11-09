import Indexer from "./indexer";
import Storage from "./storage";
import SparkMD5 from "spark-md5";

export default class PersistentMap {
  /**
   *
   * @param {string} key
   * @param {Storage} storage
   */
  constructor(key, storage) {
    this.key = key;
    this.indexer = new Indexer(storage, key);
  }

  init() {
    return this.indexer.init();
  }

  async set(key, value) {
    key = SparkMD5.hash(key);
    await this.indexer.write(key, value);
    await this.indexer.index(key);
  }

  async delete(key) {
    await this.indexer.remove(key);
    await this.indexer.deindex(key);
  }

  get(key) {
    key = SparkMD5.hash(key);
    return this.indexer.read(key);
  }

  has(key) {
    key = SparkMD5.hash(key);
    return this.indexer.exists(key);
  }

  async clear() {
    await this.indexer.clear();
  }

  async values() {
    const data = await this.indexer.readMulti(this.indexer.indices);
    return data.reduce((total, current) => {
      total.push(current[1]);
      return total;
    }, []);
  }
}
