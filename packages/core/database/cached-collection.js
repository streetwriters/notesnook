import Storage from "./storage";
import HyperSearch from "hypersearch";
import { getSchema } from "./schemas";
import PersistentCachedMap from "./persistentcachedmap";
import sort from "fast-sort";
import IndexedCollection from "./indexed-collection";

export default class CachedCollection extends IndexedCollection {
  async init() {
    const store = new PersistentCachedMap(this.storeKey, this.storage);
    await store.init();
    this.search = new HyperSearch({
      schema: getSchema(this.type),
      tokenizer: "forward",
      store,
      onIndexUpdated: async () => {
        await this.storage.write(this.indexKey, this.search.indexer.export());
      },
    });
    const index = await this.storage.read(this.indexKey);
    this.search.indexer.import(index);
  }

  exists(id) {
    const item = this.getItem(id);
    return item && !item.deleted;
  }

  getRaw() {
    return Array.from(this.search.getAllDocs());
  }

  getItems(sortFn = (u) => u.dateCreated) {
    let items = [];
    this.search.options.store.forEach((value) => {
      if (!value || value.deleted) return;
      items[items.length] = value;
    });
    return sort(items).desc(sortFn);
  }
}
