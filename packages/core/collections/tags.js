import Collection from "./collection";
import getId from "../utils/id";
import { qclone } from "qclone";
import set from "../utils/set";

export default class Tags extends Collection {
  tag(id) {
    const tagItem = this.all.find((t) => t.id === id);
    if (!tagItem) return;
    return tagItem;
  }

  async merge(tag) {
    if (!tag) return;
    if (tag.deleted) {
      await this._collection.addItem(tag);
      return;
    }
    const oldTag = this.all.find(
      (t) => t.id === tag.id || t.title === tag.title
    );

    if (!oldTag) return await this._collection.addItem(tag);

    const deletedIds = set.union(oldTag.deletedIds, tag.deletedIds);
    const noteIds = set.difference(
      set.union(oldTag.noteIds, tag.noteIds),
      deletedIds
    );

    const dateEdited =
      tag.dateEdited > oldTag.dateEdited ? tag.dateEdited : oldTag.dateEdited;
    tag = {
      ...oldTag,
      noteIds,
      dateEdited,
      deletedIds,
    };
    await this._collection.addItem(tag);
  }

  async add(tagId, noteId) {
    if (!tagId || !noteId) return;
    let tag = this.all.find((t) => t.id === tagId || t.title === tagId) || {
      title: tagId,
    };

    let id = tag.id || getId();
    let notes = tag.noteIds || [];

    if (notes.find((id) => id === noteId)) return id;

    let deletedIds = tag.deletedIds || [];
    tag = {
      type: "tag",
      id,
      title: tag.title,
      noteIds: [...notes, noteId],
      deletedIds,
    };

    await this._collection.addItem(tag);
    return id;
  }

  get raw() {
    return this._collection.getRaw();
  }

  get all() {
    return this._collection.getItems();
  }

  async remove(tagTitle, noteId) {
    if (!tagTitle || !noteId) return;
    let tag = this.all.find((t) => t.title === tagTitle);
    if (!tag) return;
    tag = qclone(tag);
    const noteIndex = tag.noteIds.indexOf(noteId);
    if (noteIndex <= -1) return;
    tag.noteIds.splice(noteIndex, 1);
    tag.deletedIds.push(noteId);
    if (tag.noteIds.length > 0) await this._collection.addItem(tag);
    else await this._collection.removeItem(tag.id);
  }
}
