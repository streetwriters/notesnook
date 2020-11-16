import Storage from "./storage";
import HyperSearch from "hypersearch";
import { getSchema } from "./schemas";
import PersistentCachedMap from "./persistentcachedmap";
import PersistentMap from "./persistentmap";
import sort from "fast-sort";

export default class IndexedCollection {
  /**
   *
   * @param {Storage} storage
   * @param {string} type
   */
  constructor(storage, type) {
    this.type = type;
    this.storage = storage;
  }

  clear() {
    return this.search.clear();
  }

  async init() {
    const index = new PersistentCachedMap(`${this.type}Index`, this.storage);
    const store = new PersistentMap(`${this.type}Store`, this.storage);
    await index.init();
    await store.init();
    this.search = new HyperSearch({
      schema: getSchema(this.type),
      tokenizer: "forward",
      index,
      store,
    });
  }

  async addItem(item) {
    const exists = this.exists(item.id);
    if (!exists) item.dateCreated = item.dateCreated || Date.now();
    await this._upsertItem(item);
  }

  /**
   * @protected
   */
  async _upsertItem(item) {
    if (!item.id) throw new Error("The item must contain the id field.");
    // if item is newly synced, remote will be true.
    item.dateEdited = item.remote ? item.dateEdited : Date.now();
    // the item has become local now, so remove the flag.
    delete item.remote;
    const exists = this.exists(item.id);
    if (!exists) await this.search.addDoc(item);
    else await this.search.updateDoc(item.id, item);
  }

  async removeItem(id) {
    await this.search.remove(id);
    await this._upsertItem({
      id,
      deleted: true,
      dateCreated: Date.now(),
      dateEdited: Date.now(),
    });
  }

  async exists(id) {
    const item = await this.getItem(id);
    return item && !item.deleted;
  }

  getItem(id) {
    return this.search.getById(id);
  }

  async getItems() {
    return await this.search.getAllDocs();
  }
}
