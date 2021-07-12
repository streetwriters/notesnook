import Collection from "./collection";
import { qclone } from "qclone";
import { makeId } from "../utils/id";
import { deleteItem } from "../utils/array";

export default class Tags extends Collection {
  tag(id) {
    const tagItem = this.all.find((t) => t.id === id || t.title === id);
    return tagItem;
  }

  async add(tagId, noteId) {
    if (tagId.id || tagId.title) {
      tagId = tagId.id;
    }

    if (!tagId || !noteId) {
      console.error("tagId and noteId cannot be falsy.");
      return;
    }

    let tag = this.all.find((t) => t.id === tagId || t.title === tagId) || {
      title: tagId,
    };

    let id = tag.id || makeId(tag.title);
    let notes = tag.noteIds || [];

    if (notes.find((id) => id === noteId)) return id;

    tag = {
      type: "tag",
      alias: tag.title,
      id,
      title: tag.title,
      noteIds: [...notes, noteId],
    };

    await this._collection.addItem(tag);
    return tag;
  }

  async rename(tagId, newName) {
    let tag = this.all.find((t) => t.id === tagId);
    if (!tag) {
      console.error(`No such tag found. Tag id:`, tagId);
      return;
    }
    tag.alias = newName;
    await this._collection.updateItem(tag);
  }

  get raw() {
    return this._collection.getRaw();
  }

  get all() {
    return this._collection.getItems();
  }

  async remove(tagTitle, noteId) {
    if (!tagTitle || !noteId) {
      console.error(
        "tag title and noteId cannot be undefined.",
        tagTitle,
        noteId
      );
      return;
    }

    let tag = this.all.find((t) => t.title === tagTitle || t.id === tagTitle);
    if (!tag) {
      console.error(`No such tag found. Tag title:`, tagTitle);
      return;
    }

    tag = qclone(tag);

    if (!deleteItem(tag.noteIds, noteId))
      console.error(`No such note exists in tag.`, tag.id, noteId);

    if (tag.noteIds.length > 0) await this._collection.addItem(tag);
    else {
      await this._db.settings.unpin(tag.id);
      await this._collection.deleteItem(tag.id);
    }
  }
}
