import { EVENTS } from "../common";
import Indexer from "./indexer";

export default class IndexedCollection {
  constructor(context, type, eventManager) {
    this.indexer = new Indexer(context, type);
    this.eventManager = eventManager;
    // this.encryptionKeyFactory = encryptionKeyFactory;
  }

  clear() {
    return this.indexer.clear();
  }

  async init() {
    await this.indexer.init();
  }

  async addItem(item) {
    if (!item.id) throw new Error("The item must contain the id field.");

    const exists = this.exists(item.id);
    if (!exists) item.dateCreated = item.dateCreated || Date.now();
    await this.updateItem(item);
    if (!exists) {
      await this.indexer.index(item.id);
    }
  }

  async updateItem(item) {
    if (!item.id) throw new Error("The item must contain the id field.");
    this.eventManager.publish(EVENTS.databaseUpdated, item.id, item);

    // if item is newly synced, remote will be true.
    if (!item.remote) {
      item.dateModified = Date.now();
      item.synced = false;
    }
    // the item has become local now, so remove the flags
    delete item.remote;
    delete item.migrated;

    // if (await this.getEncryptionKey()) {
    //   const encrypted = await this.indexer.encrypt(
    //     await this.getEncryptionKey(),
    //     JSON.stringify(item)
    //   );
    //   encrypted.dateModified = item.dateModified;
    //   encrypted.localOnly = item.localOnly;
    //   encrypted.migrated = item.migrated;
    //   encrypted.id = item.id;
    //   await this.indexer.write(item.id, encrypted);
    // } else

    await this.indexer.write(item.id, item);
  }

  removeItem(id) {
    this.eventManager.publish(EVENTS.databaseUpdated, id);
    return this.updateItem({
      id,
      deleted: true,
    });
  }

  async deleteItem(id) {
    this.eventManager.publish(EVENTS.databaseUpdated, id);
    await this.indexer.deindex(id);
    return await this.indexer.remove(id);
  }

  exists(id) {
    return this.indexer.exists(id);
  }

  async getItem(id) {
    const item = await this.indexer.read(id);
    if (!item) return;

    // if ((await this.getEncryptionKey()) && item.iv && item.cipher) {
    //   return JSON.parse(
    //     await this.indexer.decrypt(await this.getEncryptionKey(), item)
    //   );
    // } else
    return item;
  }

  async getItems(indices) {
    const data = await this.indexer.readMulti(indices);
    return Object.fromEntries(data);
  }

  async getEncryptionKey() {
    if (!this.encryptionKeyFactory) return;
    if (this.encryptionKey) return this.encryptionKey;
    this.encryptionKey = await this.encryptionKeyFactory();
    return this.encryptionKey;
  }
}
