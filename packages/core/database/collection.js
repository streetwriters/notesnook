import Indexer from "./indexer";

export default class Collection extends Indexer {
  constructor(context, type) {
    super(context, type);
    this.collection = new Map();
  }

  async initCollection() {
    await this.initIndexer();
  }

  async addItem(item) {
    this.collection.set(item.id, item);
    await this.write(item.id, item);
    await this.index(item.id);
  }

  async removeItem(id) {
    if (this.collection.delete(id)) {
      this.remove(id);
      await this.deindex(id);
    }
  }

  async getItem(id) {
    if (this.collection.has(id)) {
      return this.collection.get(id);
    } else {
      return await this.read(id);
    }
  }

  async getAllItems() {
    let items = [];
    for (let id of await this.getIndices()) {
      let item = await this.getItem(id);
      if (item) {
        items[items.length] = item;
      }
    }
    return items;
  }
}
