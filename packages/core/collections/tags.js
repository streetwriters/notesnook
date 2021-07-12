import Collection from "./collection";
import { qclone } from "qclone";
import { makeId } from "../utils/id";
import { deleteItem, deleteItems } from "../utils/array";
import setManipulator from "../utils/set";

export default class Tags extends Collection {
  tag(id) {
    const tagItem = this.all.find((t) => t.id === id || t.title === id);
    return tagItem;
  }

  async add(tagId, ...noteIds) {
    if (!tagId) {
      console.error("tagId cannot be undefined.");
      return;
    }

    if (typeof tagId === "object") {
      tagId = tagId.id;
    }

    let tag = this.tag(tagId) || {
      title: tagId,
    };

    let id = tag.id || makeId(tag.title);
    let notes = tag.noteIds || [];

    tag = {
      type: "tag",
      alias: tag.title,
      id,
      title: tag.title,
      noteIds: setManipulator.union(notes, noteIds),
    };

    await this._collection.addItem(tag);
    return tag;
  }

  async rename(tagId, newName) {
    let tag = this.tag(tagId);
    if (!tag) {
      console.error(`No tag found. Tag id:`, tagId);
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

  async remove(tagId) {
    let tag = this.tag(tagId);
    if (!tag) {
      console.error(`No tag found. Tag id:`, tagId);
      return;
    }
    for (let noteId of tag.noteIds) {
      const note = this._db.notes.note(noteId);
      if (!note) continue;
      await note.untag(tagId);
    }
    await this._db.settings.unpin(tagId);
    await this._collection.deleteItem(tagId);
  }

  async untag(tagId, ...noteIds) {
    let tag = this.tag(tagId);
    if (!tag) {
      console.error(`No such tag found. Tag title:`, tagId);
      return;
    }

    deleteItems(tag.noteIds, ...noteIds);

    if (tag.noteIds.length > 0) await this._collection.addItem(tag);
    else {
      await this._db.settings.unpin(tag.id);
      await this._collection.deleteItem(tag.id);
    }
  }
}
