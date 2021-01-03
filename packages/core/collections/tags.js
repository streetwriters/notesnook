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

  async add(tagId, noteId) {
    if (!tagId || !noteId) new Error("tagId and noteId cannot be falsy.");

    let tag = this.all.find((t) => t.id === tagId || t.title === tagId) || {
      title: tagId,
    };

    let id = tag.id || getId();
    let notes = tag.noteIds || [];

    if (notes.find((id) => id === noteId)) return id;

    tag = {
      type: "tag",
      id,
      title: tag.title,
      noteIds: [...notes, noteId],
    };

    await this._collection.addItem(tag);
    return tag;
  }

  get raw() {
    return this._collection.getRaw();
  }

  get all() {
    return this._collection.getItems();
  }

  async remove(tagTitle, noteId) {
    if (!tagTitle || !noteId) new Error("tagTitle and noteId cannot be falsy.");
    let tag = this.all.find((t) => t.title === tagTitle);
    if (!tag) throw new Error(`No tag with title "${tagTitle}" found.`);
    tag = qclone(tag);
    const noteIndex = tag.noteIds.indexOf(noteId);
    if (noteIndex <= -1)
      throw new Error(`No note of id "${noteId}" exists in this tag.`);
    tag.noteIds.splice(noteIndex, 1);
    if (tag.noteIds.length > 0) await this._collection.addItem(tag);
    else {
      await this._db.settings.unpin(tag.id);
      await this._collection.removeItem(tag.id);
    }
  }
}
