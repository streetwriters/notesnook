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
    console.log("adding attachmentitem", attachmentItem);
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

  get(noteId) {
    return this.file.filter((attachment) =>
      hasItem(attachment.noteIds, noteId)
    );
  }

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
    return { data, ...attachment };
  }

  async attachment(id) {
    return this.all.find((a) => a.id === id);
  }

  markAsUploaded(id) {
    const attachment = this.all.find((a) => a.id === id);
    console.log("mark as uploaded", id, attachment);
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

  async download(noteId) {
    const attachments = this.media.filter((attachment) =>
      hasItem(attachment.noteIds, noteId)
    );
    console.log("Downloading attachments", attachments);
    for (let i = 0; i < attachments.length; i++) {
      sendAttachmentsProgressEvent("download", attachments.length, i);

      const { hash } = attachments[i].metadata;

      const isDownloaded = await this._db.fs.downloadFile(noteId, hash);
      if (!isDownloaded) continue;

      const attachment = await this.read(hash);
      if (!attachment) continue;

      EV.publish(EVENTS.mediaAttachmentDownloaded, {
        hash,
        src: dataurl.fromObject({
          type: attachment.metadata.type,
          data: attachment.data,
        }),
      });
    }
    sendAttachmentsProgressEvent("download", attachments.length);
  }

  get deleted() {
    return this.all.filter((attachment) => attachment.dateDeleted > 0);
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

  get media() {
    return this.all.filter((attachment) =>
      attachment.metadata.type.startsWith("image/")
    );
  }

  get file() {
    return this.all.filter(
      (attachment) => !attachment.metadata.type.startsWith("image/")
    );
  }

  get all() {
    return this._collection.getItems();
  }
}
