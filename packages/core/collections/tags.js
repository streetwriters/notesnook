import Collection from "./collection";
import { qclone } from "qclone";
import { makeId } from "../utils/id";
import { deleteItem, deleteItems, hasItem } from "../utils/array";
import setManipulator from "../utils/set";

export default class Tags extends Collection {
  tag(id) {
    const tagItem = this.all.find((t) => t.id === id || t.title === id);
    return tagItem;
  }

  async add(tagId, ...noteIds) {
    tagId = this.sanitize(tagId);
    if (!tagId) throw new Error("Tag title cannot be empty.");

    let tag = this.tag(tagId);

    if (tag && !noteIds.length)
      throw new Error("A tag with this id already exists.");

    tag = tag || {
      title: tagId,
    };

    let id = tag.id || makeId(tag.title.toLowerCase());
    let notes = tag.noteIds || [];

    tag = {
      type: "tag",
      id,
      title: tag.title,
      alias: tag.title,
      noteIds: setManipulator.union(notes, noteIds),
    };

    await this._collection.addItem(tag);
    if (!this._db.settings.getAlias(tag.id))
      await this._db.settings.setAlias(tag.id, tag.title);
    return tag;
  }

  async rename(tagId, newName) {
    let tag = this.tag(tagId);
    if (!tag) {
      console.error(`No tag found. Tag id:`, tagId);
      return;
    }
    await this._db.settings.setAlias(tagId, newName);

    tag.alias = newName;
    await this._collection.addItem(tag);
  }

  alias(tagId) {
    let tag = this.tag(tagId);
    if (!tag) {
      console.error(`No tag found. Tag id:`, tagId);
      return;
    }

    return tag.alias || this._db.settings.getAlias(tagId) || tag.title;
  }

  get raw() {
    return this._collection.getRaw();
  }

  get all() {
    return this._collection.getItems(undefined, (item) => {
      if (item.alias) return item;
      item.alias = this._db.settings.getAlias(item.id) || item.title;
      return item;
    });
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
      if (hasItem(note.tags, tag.title)) await note.untag(tag.title);
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

  sanitize(tag) {
    if (!tag) return;
    let sanitized = tag.toLocaleLowerCase();
    sanitized = sanitized.replace(
      /[+!@#$%^&*()+\{\}\]\[:;'"<>?\/\.\s=,]+/g,
      ""
    );
    return sanitized.trim();
  }
}
