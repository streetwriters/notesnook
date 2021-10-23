import Collection from "./collection";
import id from "../utils/id";
import { deleteItem, hasItem } from "../utils/array";
import hosts from "../utils/constants";
import { EV, EVENTS, sendAttachmentsProgressEvent } from "../common";
import dataurl from "../utils/dataurl";
import dayjs from "dayjs";

export default class Attachments extends Collection {
  constructor(db, name, cached) {
    super(db, name, cached);
    this.key = null;
  }

  async _getEncryptionKey() {
    if (!this.key) this.key = await this._db.user.getEncryptionKey();
    if (!this.key)
      throw new Error(
        "Failed to get user encryption key. Cannot cache attachments."
      );
    return this.key;
  }

  /**
   *
   * @param {{
   *  iv: string,
   *  salt: string,
   *  length: number,
   *  alg: string,
   *  hash: string,
   *  hashType: string,
   *  filename: string,
   *  type: string
   * }} attachment
   * @param {string} noteId Optional as attachments will be parsed at extraction time
   * @returns
   */
  add(attachment, noteId) {
    if (!attachment)
      return console.error("attachment or noteId cannot be null");

    if (attachment.remote) return this._collection.addItem(attachment);

    if (!attachment.hash) throw new Error("Please provide attachment hash.");

    const oldAttachment = this.all.find(
      (a) => a.metadata.hash === attachment.hash
    );
    if (oldAttachment) {
      if (!noteId || oldAttachment.noteIds.includes(noteId)) return;

      oldAttachment.noteIds.push(noteId);
      oldAttachment.dateDeleted = undefined;
      return this._collection.updateItem(oldAttachment);
    }

    const { iv, salt, length, alg, hash, hashType, filename, type } =
      attachment;

    if (
      !iv ||
      !salt ||
      !length ||
      !alg ||
      !hash ||
      !hashType ||
      !filename ||
      !type
    )
      throw new Error("Could not add attachment: all properties are required.");

    const attachmentItem = {
      id: id(),
      noteIds: noteId ? [noteId] : [],
      iv,
      salt,
      length,
      alg,
      metadata: {
        hash,
        hashType,
        filename,
        type,
      },
      dateCreated: Date.now(),
      dateEdited: undefined,
      dateUploaded: undefined,
      dateDeleted: undefined,
    };
    return this._collection.addItem(attachmentItem);
  }

  async delete(hash, noteId) {
    const attachment = this.all.find((a) => a.metadata.hash === hash);
    if (!attachment || !deleteItem(attachment.noteIds, noteId)) return;
    if (!attachment.noteIds.length) {
      attachment.dateDeleted = Date.now();
      EV.publish(EVENTS.attachmentDeleted, attachment);
    }
    return await this._collection.updateItem(attachment);
  }

  async remove(hash, localOnly) {
    const attachment = this.all.find((a) => a.metadata.hash === hash);
    if (!attachment) return false;
    if (await this._db.fs.deleteFile(hash, localOnly)) {
      await this._collection.deleteItem(attachment.id);
      return true;
    }
    return false;
  }

  /**
   * Get specified type of attachments of a note
   * @param {string} noteId
   * @param {"files"|"images"|"all"} type
   * @returns
   */
  ofNote(noteId, type) {
    let attachments = [];

    if (type === "files") attachments = this.files;
    else if (type === "images") attachments = this.images;
    else if (type === "all") attachments = this.all;

    return attachments.filter((attachment) =>
      hasItem(attachment.noteIds, noteId)
    );
  }

  exists(hash) {
    const attachment = this.all.find((a) => a.metadata.hash === hash);
    return !!attachment;
  }

  /**
   * @param {string} hash
   * @returns {Promise<string>} dataurl formatted string
   */
  async read(hash) {
    const attachment = this.all.find((a) => a.metadata.hash === hash);
    if (!attachment) return;

    const data = await this._db.fs.readEncrypted(
      attachment.metadata.hash,
      await this._getEncryptionKey(),
      {
        iv: attachment.iv,
        salt: attachment.salt,
        length: attachment.length,
        alg: attachment.alg,
        outputType: "base64",
      }
    );
    return dataurl.fromObject({ type: attachment.metadata.type, data });
  }

  attachment(hashOrId) {
    return this.all.find(
      (a) => a.id === hashOrId || a.metadata.hash === hashOrId
    );
  }

  markAsUploaded(id) {
    const attachment = this.all.find((a) => a.id === id);
    if (!attachment) return;
    attachment.dateUploaded = Date.now();
    return this._collection.updateItem(attachment);
  }

  async save(data, type) {
    return await this._db.fs.writeEncrypted(
      null,
      data,
      type,
      await this._getEncryptionKey()
    );
  }

  async downloadImages(noteId) {
    const attachments = this.images.filter((attachment) =>
      hasItem(attachment.noteIds, noteId)
    );
    try {
      for (let i = 0; i < attachments.length; i++) {
        const { hash } = attachments[i].metadata;
        await this._downloadMedia(hash, {
          total: attachments.length,
          current: i,
          groupId: noteId,
        });
      }
    } finally {
      sendAttachmentsProgressEvent("download", noteId, attachments.length);
    }
  }

  async _downloadMedia(hash, { total, current, groupId }, notify = true) {
    sendAttachmentsProgressEvent("download", groupId, total, current);
    const isDownloaded = await this._db.fs.downloadFile(groupId, hash);
    if (!isDownloaded) return;

    const src = await this.read(hash);
    if (!src) return;

    if (notify)
      EV.publish(EVENTS.mediaAttachmentDownloaded, {
        groupId,
        hash,
        src,
      });

    return src;
  }

  async cleanup() {
    const now = dayjs().unix();
    for (const attachment of this.deleted) {
      if (dayjs(attachment.dateDeleted).add(7, "days").unix() < now) continue;

      const isDeleted = await this._db.fs.deleteFile(attachment.metadata.hash);
      if (!isDeleted) continue;

      await this._collection.removeItem(attachment.id);
    }
  }

  get pending() {
    return this.all.filter(
      (attachment) =>
        (attachment.dateUploaded <= 0 || !attachment.dateUploaded) &&
        attachment.noteIds.length > 0
    );
  }

  get deleted() {
    return this.all.filter((attachment) => attachment.dateDeleted > 0);
  }

  get images() {
    return this.all.filter((attachment) =>
      attachment.metadata.type.startsWith("image/")
    );
  }

  get files() {
    return this.all.filter(
      (attachment) => !attachment.metadata.type.startsWith("image/")
    );
  }

  get all() {
    return this._collection.getItems();
  }
}
