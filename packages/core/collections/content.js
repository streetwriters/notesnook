import Collection from "./collection";
import getId from "../utils/id";

export default class Content extends Collection {
  async add(content) {
    if (!content) return;
    if (content.deleted || content.migrated)
      return await this._collection.addItem(content);

    const oldContent = await this.raw(content.id);
    if (content.id && oldContent) {
      content = {
        ...oldContent,
        ...content,
      };
    }

    const id = content.id || getId();
    await this._collection.addItem({
      noteId: content.noteId,
      id,
      type: content.type,
      data: content.data || content,
      dateEdited: content.dateEdited,
      dateCreated: content.dateCreated,
      remote: content.remote,
      localOnly: !!content.localOnly,
      conflicted: content.conflicted,
      dateResolved: content.dateResolved,
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

  async cleanup() {
    const indices = this._collection.indexer.indices;
    await this._db.notes.init();
    const notes = this._db.notes._collection.getRaw();
    if (!notes.length && indices.length > 0) return [];
    let ids = [];
    for (let contentId of indices) {
      const noteIndex = notes.findIndex((note) => note.contentId === contentId);
      const isOrphaned = noteIndex === -1;
      if (isOrphaned) {
        ids.push(contentId);
        await this._collection.deleteItem(contentId);
      } else if (notes[noteIndex].localOnly) {
        ids.push(contentId);
      }
    }
    return ids;
  }
}
