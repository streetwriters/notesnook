import Collection from "./collection";
import id from "../utils/id";
import SparkMD5 from "spark-md5";
import { deleteItem } from "../utils/array";

export default class Attachments extends Collection {
  constructor(db, name, cached) {
    super(db, name, cached);
    this.key = null;
  }

  async _initEncryptionKey() {
    if (!this.key) this.key = await this._db.user.getEncryptionKey();
    if (!this.key)
      throw new Error(
        "Failed to get user encryption key. Cannot cache attachments."
      );
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
    if (!attachment || !noteId)
      return console.error("attachment or noteId cannot be null");

    if (!attachment.hash) throw new Error("Please provide attachment hash.");

    const oldAttachment = this.all.find(
      (a) => a.metadata.hash === attachment.hash
    );
    if (oldAttachment) {
      if (oldAttachment.noteIds.includes(noteId)) return;

      oldAttachment.noteIds.push(noteId);
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
    return this._collection.addItem(attachmentItem);
  }

  delete(hash, noteId) {
    const attachment = this.all.find((a) => a.metadata.hash === hash);
    if (!attachment || !deleteItem(attachment.noteIds, noteId)) return;
    if (!attachment.noteIds.length) attachment.dateDeleted = Date.now();

    return this._collection.updateItem(attachment);
  }

  async get(hash) {
    const attachment = this.all.find((a) => a.metadata.hash === hash);
    if (!attachment) return;
    await this._initEncryptionKey();
    const data = await this._db.fs.readEncrypted(attachment.hash, this.key, {
      iv: attachment.iv,
      salt: attachment.salt,
      length: attachment.length,
      alg: attachment.alg,
      outputType: "base64",
    });
    attachment.data = data;
    return attachment;
  }

  async save(data, type) {
    await this._initEncryptionKey();
    await this._db.fs.writeEncrypted(null, { data, type, key: this.key });
  }

  get pending() {
    return this.all.filter((attachment) => !attachment.dateUploaded);
  }

  get all() {
    return this._collection.getItems();
  }
}
