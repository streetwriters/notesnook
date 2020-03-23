import CachedCollection from "../database/cached-collection";
import getId from "../utils/id";
import { qclone } from "qclone";
import set from "../utils/set";

export default class Tags {
  constructor(context, name) {
    this._collection = new CachedCollection(context, name);
  }

  init() {
    return this._collection.init();
  }

  notes(tag) {
    const tagItem = this.all.find(t => t.title === tag);
    if (!tagItem) return [];
    return tagItem.noteIds;
  }

  tag(id) {
    const tagItem = this.all.find(t => t.id === id);
    if (!tagItem) return;
    return tagItem;
  }

  async merge(tag) {
    if (!tag) return;
    const oldTag = this.all.find(t => t.id === tag.id);
    if (!oldTag) return await this._collection.addItem(tag);
    const noteIds = set.union(oldTag.noteIds, tag.noteIds);
    const dateEdited =
      tag.dateEdited > oldTag.dateEdited ? tag.dateEdited : oldTag.dateEdited;
    tag = {
      ...oldTag,
      noteIds,
      dateEdited
    };
    await this._collection.addItem(tag);
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

  get raw() {
    return this._collection.getRaw();
  }

  get all() {
    return this._collection.getAllItems();
  }

  async remove(tagTitle, noteId) {
    if (!tagTitle || !noteId) return;
    let tag = this.all.find(t => t.title === tagTitle);
    if (!tag) return;
    tag = qclone(tag);
    const noteIndex = tag.noteIds.indexOf(noteId);
    if (noteIndex <= -1) return;
    tag.noteIds.splice(noteIndex, 1);
    if (tag.noteIds.length > 0) await this._collection.addItem(tag);
    await this._collection.removeItem(tag.id);
  }
}
