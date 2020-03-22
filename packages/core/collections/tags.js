import CachedCollection from "../database/cached-collection";
import getId from "../utils/id";
export default class Tags {
  constructor(context, name) {
    this._collection = new CachedCollection(context, name);
  }

  init() {
    return this._collection.init();
  }

  get(tag) {
    const tagItem = this.all.find(t => t.title === tag);
    if (!tagItem) return [];
    return tagItem.noteIds;
  }

  async add(tagTitle, noteId) {
    if (!tagTitle || !noteId) return;
    const oldTag = this.all.find(t => t.title === tagTitle) || {};

    let tag = { ...oldTag, title: tagTitle };
    let id = tag.id || getId();
    let notes = tag.noteIds || [];
    tag = {
      id,
      title: tag.title,
      noteIds: [...notes, noteId]
    };

    await this._collection.addItem(tag);
  }

  get all() {
    return this._collection.getAllItems();
  }

  async remove(tagTitle, noteId) {
    if (!tagTitle || !noteId) return;
    const tag = this.all.find(t => t.title === tagTitle);
    if (!tag) return;
    const noteIndex = tag.noteIds.indexOf(noteId);
    if (noteIndex <= -1) return;
    tag.noteIds.splice(noteIndex, 1);
    if (tag.noteIds.length > 0) await this._collection.addItem(tag);
    await this._collection.removeItem(tag.id);
  }
}
