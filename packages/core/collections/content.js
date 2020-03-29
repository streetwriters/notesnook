import IndexedCollection from "../database/indexed-collection";
import getId from "../utils/id";

export default class Content {
  constructor(context, name) {
    this._collection = new IndexedCollection(context, name);
  }

  init() {
    return this._collection.init();
  }

  async add(content) {
    if (!content) return;
    const id = content.id || getId();
    await this._collection.addItem({
      noteId: content.noteId,
      id,
      data: content.data || content,
      conflicted: content.conflicted || false
    });
    return id;
  }

  async get(id) {
    const content = await this.raw(id);
    if (!content) return;
    return content.data;
  }

  async raw(id) {
    const content = await this._collection.getItem(id);
    if (!content) return;
    return content;
  }

  remove(id) {
    if (!id) return;
    return this._collection.removeItem(id);
  }

  multi(ids) {
    return this._collection.getItems(ids);
  }

  all() {
    return this._collection.getItems(this._collection.indexer.indices);
  }
}
