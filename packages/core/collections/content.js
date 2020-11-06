import Collection from "./collection";
import getId from "../utils/id";

export default class Content extends Collection {
  async add(content) {
    if (!content) return;

    if (content.id && (await this._collection.exists(content.id))) {
      content = {
        ...(await this.raw(content.id)),
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

  all() {
    return this._collection.getItems();
  }
}
