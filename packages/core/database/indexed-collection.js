import Indexer from "./indexer";
import HyperSearch from "hypersearch";
import { getSchema } from "./schemas";

export default class IndexedCollection {
  constructor(context, type) {
    this.indexer = new Indexer(context, type);
    this.type = type;
    this.search = new HyperSearch({
      schema: getSchema(type),
      tokenizer: "forward",
    });
  }

  clear() {
    return this.indexer.clear();
  }

  async init() {
    await this.indexer.init();
    const index = await this.indexer.read(`${this.type}-index`);
    if (index) this.search.import(index);
  }

  async addItem(item) {
    const exists = await this.exists(item.id);
    if (!exists) item.dateCreated = item.dateCreated || Date.now();
    await this.updateItem(item);
    if (!exists) {
      await this.indexer.index(item.id);
    }
  }

  async updateItem(item, index = true) {
    if (!item.id) throw new Error("The item must contain the id field.");
    // if item is newly synced, remote will be true.
    item.dateEdited = item.remote ? item.dateEdited : Date.now();
    // the item has become local now, so remove the flag.
    delete item.remote;
    await this.indexer.write(item.id, item);

    if (index && (this.type === "notes" || this.type === "notebooks")) {
      this.search.addDoc(item);
      this.indexer.write(`${this.type}-index`, this.search.export());
    }
  }

  async removeItem(id) {
    await this.updateItem(
      {
        id,
        deleted: true,
        dateCreated: Date.now(),
        dateEdited: Date.now(),
      },
      false
    );
    if (this.type === "notes" || this.type === "notebooks")
      this.search.remove(id);
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
