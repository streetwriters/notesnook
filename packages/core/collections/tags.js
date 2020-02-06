import CachedCollection from "../database/cached-collection";

export default class Tags {
  constructor(context, name) {
    this.collection = new CachedCollection(context, name);
  }

  init() {
    return this.collection.init();
  }

  async add(id) {
    if (!id || id.trim().length <= 0) return;
    let tag = (await this.collection.getItem(id)) || {
      id,
      title: id,
      count: 0
    };
    tag.count++;
    await this.collection.addItem(tag);
  }

  all() {
    return this.collection.getAllItems();
  }

  async remove(id) {
    if (!id || id.trim().length <= 0) return;
    let tag = this.collection.getItem(id);
    if (!tag) return;
    tag.count--;
    if (tag.count === 0) {
      await this.collection.removeItem(id);
    } else {
      await this.collection.addItem(tag);
    }
  }
}
