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
      conflicted: content.conflicted || false,
      resolved: !!content.resolved,
      dateEdited: content.dateEdited,
      dateCreated: content.dateCreated,
      remote: content.remote,
      localOnly: !!content.localOnly,
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
    const allContent = await this.all();
    let ids = [];
    for (let content of allContent) {
      const { noteId } = content;
      const note = this._db.notes._collection.getItem(noteId);
      if (!note || note.contentId !== content.id) {
        ids.push(content.id);
        await this._collection.deleteItem(content.id);
      }
    }
    return ids;
  }
}
