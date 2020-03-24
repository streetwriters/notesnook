import Indexer from "./indexer";

export default class IndexedCollection {
  constructor(context, type) {
    this.indexer = new Indexer(context, type);
  }

  async init() {
    await this.indexer.init();
  }

  async addItem(item) {
    if (!item.id) throw new Error("The item must contain the id field.");

    const exists = await this.exists(item.id);
    if (!exists) item.dateCreated = item.dateCreated || Date.now();
    await this.updateItem(item);
    if (!exists) {
      await this.indexer.index(item.id);
    }
  }

  async updateItem(item) {
    if (!item.id) throw new Error("The item must contain the id field.");
    // if item is newly synced, remote will be true.
    item.dateEdited = item.remote ? item.dateEdited : Date.now();
    // the item has become local now, so remove the flag.
    delete item.remote;
    await this.indexer.write(item.id, item);
  }

  async removeItem(id) {
    await this.indexer.write(id, {
      id,
      deleted: true,
      dateCreated: Date.now(),
      dateEdited: Date.now()
    });
  }

  exists(id) {
    return this.indexer.exists(id);
  }

  getItem(id) {
    return this.indexer.read(id);
  }

  async getItems(indices) {
    const data = await this.indexer.readMulti(indices);
    return data.reduce((total, current) => {
      total.push(current[1]);
      return total;
    }, []);
  }
}
