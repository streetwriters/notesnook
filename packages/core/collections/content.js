import Collection from "./collection";
import getId from "../utils/id";
import { getContentFromData } from "../content-types";
import { hasItem } from "../utils/array";

export default class Content extends Collection {
  async add(content) {
    if (!content) return;

    if (typeof content.data === "object") {
      if (typeof content.data.data === "string")
        content.data = content.data.data;
      else
        content.data = `<p>Content is invalid: ${JSON.stringify(
          content.data
        )}</p>`;
    }

    if (content.remote || content.deleted || content.migrated)
      return await this._collection.addItem(
        await this.extractAttachments(content)
      );

    const oldContent = await this.raw(content.id, false);
    if (content.id && oldContent) {
      content = {
        ...oldContent,
        ...content,
        dateEdited: content.dateEdited || Date.now(),
      };
    }

    const id = content.id || getId();

    const contentItem = await this.extractAttachments({
      noteId: content.noteId,
      id,
      type: content.type,
      data: content.data || content,
      dateEdited: content.dateEdited,
      dateCreated: content.dateCreated,
      dateModified: content.dateModified,
      localOnly: !!content.localOnly,
      conflicted: content.conflicted,
      dateResolved: content.dateResolved,
    });
    await this._collection.addItem(contentItem);

    if (content.sessionId) {
      await this._db.noteHistory.add(contentItem.noteId, content.sessionId, {
        data: contentItem.data,
        type: contentItem.type,
      });
    }
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

  async all() {
    return Object.values(
      await this._collection.getItems(this._collection.indexer.indices)
    );
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
      const attachment = this._db.attachments.attachment(hash);
      if (!attachment) return;

      const progressData = {
        total,
        current,
        groupId,
      };

      return this._db.attachments._downloadMedia(
        attachment,
        progressData,
        notify
      );
    });
    return contentItem;
  }

  async _insert(contentItem, getData) {
    if (!contentItem || !getData) return;
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
      return attachments.every(
        (a) => a.hash && a.hash !== attachment.metadata.hash
      );
    });

    const toAdd = attachments.filter((attachment) => {
      return (
        attachment.hash &&
        noteAttachments.every((a) => attachment.hash !== a.metadata.hash)
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

    if (toAdd.length > 0) {
      contentItem.dateModified = Date.now();
    }
    contentItem.data = data;
    return contentItem;
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
