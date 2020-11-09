import Storage from "./storage";
import Indexer from "./indexer";
import SparkMD5 from "spark-md5";

export default class PersistentCachedMap {
  /**
   *
   * @param {string} key
   * @param {Storage} storage
   */
  constructor(key, storage) {
    this.key = key;
    this.indexer = new Indexer(storage, key);
  }

  async init() {
    await this.indexer.init();
    const data = await this.indexer.readMulti(this.indexer.indices);
    this.map = new Map(data);
  }

  async set(key, value) {
    key = SparkMD5.hash(key);
    this.map.set(key, value);
    await this.indexer.write(key, value);
    await this.indexer.index(key);
  }

  async delete(key) {
    await this.indexer.remove(key);
    await this.indexer.deindex(key);
    return this.map.delete(key);
  }

  get(key) {
    key = SparkMD5.hash(key);
    return this.map.get(key);
  }

  has(key) {
    key = SparkMD5.hash(key);
    return this.map.has(key);
  }

  async clear() {
    await this.indexer.clear();
    this.map.clear();
  }

  values() {
    return this.map.values();
  }

  forEach(callbackFn) {
    return this.map.forEach(callbackFn);
  }
}
