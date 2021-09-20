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
    if (!attachment)
      return console.error("attachment or noteId cannot be null");

    if (attachment.remote) return this._collection.addItem(attachment);

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
    console.log("adding attachmentitem", attachmentItem);
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
    const data = await this._db.fs.readEncrypted(
      attachment.metadata.hash,
      this.key,
      {
        iv: attachment.iv,
        salt: attachment.salt,
        length: attachment.length,
        alg: attachment.alg,
        outputType: "base64",
      }
    );
    attachment.data = data;
    return attachment;
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
    await this._initEncryptionKey();
    await this._db.fs.writeEncrypted(null, { data, type, key: this.key });
  }

  get pending() {
    return this.all.filter(
      (attachment) => attachment.dateUploaded <= 0 || !attachment.dateUploaded
    );
  }

  get media() {
    return this.all.filter((attachment) =>
      attachment.metadata.type.startsWith("image/")
    );
  }

  get all() {
    return this._collection.getItems();
  }
}
