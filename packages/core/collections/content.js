import Collection from "./collection";
import getId from "../utils/id";
import { getContentFromData } from "../content-types";
import { diff, hasItem } from "../utils/array";

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

  async raw(id, withAttachments = true) {
    const content = await this._collection.getItem(id);
    if (!content) return;
    return withAttachments ? await this.insertAttachments(content) : content;
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

  async insertAttachments(contentItem) {
    const content = getContentFromData(contentItem.type, contentItem.data);
    contentItem.data = await content.insertAttachments((hash) => {
      return this._db.attachments.get(hash);
    });
    return contentItem;
  }

  async extractAttachments(contents) {
    const allAttachments = this._db.attachments.all;
    for (let contentItem of contents) {
      const content = getContentFromData(contentItem.type, contentItem.data);
      const { data, attachments } = await content.extractAttachments(
        (data, type) => this._db.attachments.save(data, type)
      );

      await diff(allAttachments, attachments, async (attachment, action) => {
        if (hasItem(attachment.noteIds, contentItem.noteId)) return;

        if (action === "delete") {
          await this._db.attachments.delete(
            attachment.hash,
            contentItem.noteId
          );
        } else if (action === "insert") {
          await this._db.attachments.add(attachment, contentItem.noteId);
        }
      });

      contentItem.data = data;
    }
    return contents;
  }
}
