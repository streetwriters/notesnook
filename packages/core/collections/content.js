import Collection from "./collection";
import getId from "../utils/id";
import { getContentFromData } from "../content-types";
import { hasItem } from "../utils/array";

export default class Content extends Collection {
  async add(content) {
    if (!content) return;
    if (content.remote || content.deleted || content.migrated)
      return await this._collection.addItem(
        await this.extractAttachments(content)
      );

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
        localOnly: !!content.localOnly,
        conflicted: content.conflicted,
        dateResolved: content.dateResolved,
        persistDateEdited: !!content.persistDateEdited,
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

  async downloadMedia(groupId, contentItem, notify = true) {
    const content = getContentFromData(contentItem.type, contentItem.data);
    contentItem.data = await content.insertMedia((hash, { total, current }) => {
      return this._db.attachments._downloadMedia(
        hash,
        {
          total,
          current,
          groupId,
        },
        notify
      );
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
    const { data, attachments } = content.extractAttachments();

    const noteAttachments = allAttachments.filter((attachment) =>
      hasItem(attachment.noteIds, contentItem.noteId)
    );

    const toDelete = noteAttachments.filter((attachment) => {
      return attachments.every((a) => a.hash !== attachment.metadata.hash);
    });

    const toAdd = attachments.filter((attachment) => {
      return noteAttachments.every((a) => attachment.hash !== a.metadata.hash);
    });

    for (let attachment of toDelete) {
      await this._db.attachments.delete(
        attachment.metadata.hash,
        contentItem.noteId
      );
    }

    for (let attachment of toAdd) {
      if (attachment.data && attachment.type) {
        const { key, metadata } = await this._db.attachments.save(
          attachment.data,
          attachment.type
        );
        attachment = {
          type: attachment.type,
          filename: metadata.hash,
          ...metadata,
          key,
        };
      }
      await this._db.attachments.add(attachment, contentItem.noteId);
    }

    if (toAdd.length > 0) {
      contentItem.dateEdited = Date.now();
    }
    contentItem.data = data;
    return contentItem;
  }
}
