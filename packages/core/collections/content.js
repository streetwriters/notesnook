import Collection from "./collection";
import getId from "../utils/id";
import { getContentFromData } from "../content-types";
import { hasItem } from "../utils/array";

export default class Content extends Collection {
  async add(content) {
    if (!content) return;
    if (content.deleted || content.migrated)
      return await this._collection.addItem(content);

    const oldContent = await this.raw(content.id, false);
    if (content.id && oldContent) {
      content = {
        ...oldContent,
        ...content,
      };
    }

    const id = content.id || getId();
    await this._collection.addItem(
      await this.extractAttachments({
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
      })
    );
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

  insertMedia(contentItem) {
    return this._insert(contentItem, this._db.attachments.read);
  }

  insertPlaceholders(contentItem, placeholder) {
    return this._insert(contentItem, () => placeholder);
  }

  async downloadMedia(groupId, contentItem) {
    const content = getContentFromData(contentItem.type, contentItem.data);
    contentItem.data = await content.insertMedia((hash, { total, current }) => {
      return this._db.attachments._downloadMedia(hash, {
        total,
        current,
        groupId,
      });
    });
    return contentItem;
  }

  async _insert(contentItem, getData) {
    const content = getContentFromData(contentItem.type, contentItem.data);
    contentItem.data = await content.insertMedia(getData);
    return contentItem;
  }

  /**
   *
   * @param {any} contentItem
   * @returns {Promise<any>}
   */
  async extractAttachments(contentItem) {
    if (contentItem.localOnly || typeof contentItem.data !== "string")
      return contentItem;

    const allAttachments = this._db.attachments.all;
    const content = getContentFromData(contentItem.type, contentItem.data);
    const { data, attachments } = await content.extractAttachments(
      (data, type) => this._db.attachments.save(data, type)
    );

    const noteAttachments = allAttachments.filter((attachment) =>
      hasItem(attachment.noteIds, contentItem.noteId)
    );

    const toDelete = noteAttachments.filter((attachment) => {
      return attachments.every((a) => a.hash !== attachment.metadata.hash);
    });

    const toAdd = attachments.filter((a) => {
      return noteAttachments.every(
        (attachment) => a.hash !== attachment.metadata.hash
      );
    });

    for (let attachment of toDelete) {
      await this._db.attachments.delete(
        attachment.metadata.hash,
        contentItem.noteId
      );
    }

    for (let attachment of toAdd) {
      await this._db.attachments.add(attachment, contentItem.noteId);
    }

    contentItem.data = data;
    return contentItem;
  }
}
