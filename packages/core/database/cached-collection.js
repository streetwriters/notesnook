import Indexer from "./indexer";

export default class CachedCollection {
  constructor(context, type) {
    this.map = new Map();
    this.indexer = new Indexer(context, type);
  }

  async init() {
    await this.indexer.init();
    for (let id of this.indexer.indices) {
      this.map.set(id, await this.indexer.read(id));
    }
  }

  async addItem(item) {
    if (!item.id) throw new Error("The item must contain the id field.");

    let exists = this.map.has(item.id);
    await this.updateItem(item);
    if (!exists) {
      await this.indexer.index(item.id);
    }
  }

  async updateItem(item) {
    if (!item.id) throw new Error("The item must contain the id field.");

    this.map.set(item.id, item);
    await this.indexer.write(item.id, item);
  }

  async removeItem(id) {
    if (this.map.delete(id)) {
      this.indexer.remove(id);
      await this.indexer.deindex(id);
    }
  }

  getItem(id) {
    return this.map.get(id);
  }

  getAllItems() {
    let items = [];
    for (let value of this.map.values()) {
      items[items.length] = value;
    }
    return items;
  }
}
