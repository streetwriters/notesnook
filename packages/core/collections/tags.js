import CachedCollection from "../database/cached-collection";

export default class Tags {
  constructor(context, name) {
    this._collection = new CachedCollection(context, name);
  }

  init() {
    return this._collection.init();
  }

  async add(id) {
    if (!id || id.trim().length <= 0) return;
    let tag = this._collection.exists(id)
      ? { ...(await this._collection.getItem(id)) }
      : {
          id,
          title: id,
          count: 0
        };
    tag.count++;
    await this._collection.addItem(tag);
  }

  get all() {
    return this._collection.getAllItems();
  }

  async remove(id) {
    if (!id || id.trim().length <= 0) return;
    let tag = this._collection.getItem(id);
    if (!tag) return;
    tag = { ...tag };
    tag.count--;
    if (tag.count === 0) {
      await this._collection.removeItem(id);
    } else {
      await this._collection.addItem(tag);
    }
  }
}
