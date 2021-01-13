import Indexer from "./indexer";
import sort from "fast-sort";
import { EV } from "../common";
import IndexedCollection from "./indexed-collection";

export default class CachedCollection extends IndexedCollection {
  constructor(context, type) {
    super(context, type);
    this.map = new Map();
  }

  async init() {
    await super.init();
    const data = await this.indexer.readMulti(this.indexer.indices);
    this.map = new Map(data);
  }

  async clear() {
    await super.clear();
    this.map.clear();
  }

  async updateItem(item) {
    EV.publish("db:write", item);
    await super.updateItem(item);
    this.map.set(item.id, item);
  }

  exists(id) {
    return this.map.has(id) && !this.map.get(id).deleted;
  }

  getItem(id) {
    return this.map.get(id);
  }

  async deleteItem(id) {
    this.map.delete(id);
    await super.deleteItem(id);
  }

  getRaw() {
    return Array.from(this.map.values());
  }

  getItems(sortFn = (u) => u.dateCreated) {
    let items = [];
    this.map.forEach((value) => {
      if (!value || value.deleted || !value.id) return;
      items[items.length] = value;
    });
    return sort(items).desc(sortFn);
  }
}
