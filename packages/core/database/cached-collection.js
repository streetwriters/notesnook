import sort from "fast-sort";
import IndexedCollection from "./indexed-collection";
import MapStub from "../utils/map";

export default class CachedCollection extends IndexedCollection {
  constructor(context, type) {
    super(context, type);
    this.type = type;
    this.map = new Map();
  }

  async init() {
    await super.init();
    const data = await this.indexer.readMulti(this.indexer.indices);
    if (this.map && this.map.dispose) this.map.dispose();
    this.map = new MapStub.Map(data, this.type);
  }

  async clear() {
    await super.clear();
    this.map.clear();
  }

  async updateItem(item) {
    await super.updateItem(item);
    this.map.set(item.id, item);
  }

  exists(id) {
    return this.map.has(id) && !this.map.get(id).deleted;
  }

  has(id) {
    return this.map.has(id);
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

  getItems(sortFn = (u) => u.dateCreated, manipulate = (item) => item) {
    let items = [];
    this.map.forEach((value) => {
      if (!value || value.deleted || !value.id) return;
      value = manipulate ? manipulate(value) : value;
      items.push(value);
    });
    return sort(items).desc(sortFn);
  }
}
