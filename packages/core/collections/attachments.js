/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import Collection from "./collection";
import { getId } from "../utils/id";
import { deleteItem, hasItem } from "../utils/array";
import { EV, EVENTS, sendAttachmentsProgressEvent } from "../common";
import dataurl from "../utils/dataurl";
import dayjs from "dayjs";
import setManipulator from "../utils/set";
import {
  getFileNameWithExtension,
  isImage,
  isWebClip
} from "../utils/filename";

export default class Attachments extends Collection {
  constructor(db, name, cached) {
    super(db, name, cached);
    this.key = null;
  }

  merge(remoteAttachment) {
    if (remoteAttachment.deleted)
      return this._collection.addItem(remoteAttachment);

    const id = remoteAttachment.id;
    let localAttachment = this._collection.getItem(id);

    if (localAttachment && localAttachment.noteIds) {
      remoteAttachment.noteIds = setManipulator.union(
        remoteAttachment.noteIds,
        localAttachment.noteIds
      );
    }

    return this._collection.addItem(remoteAttachment);
  }

  /**
   *
   * @param {{
   *  iv: string,
   *  length: number,
   *  alg: string,
   *  hash: string,
   *  hashType: string,
   *  filename: string,
   *  type: string,
   *  salt: string,
   *  chunkSize: number,
   *  key: {}
   * }} attachmentArg
   * @param {string} noteId Optional as attachments will be parsed at extraction time
   * @returns
   */
  async add(attachmentArg, noteId = undefined) {
    if (!attachmentArg) return console.error("attachment cannot be undefined");
    if (!attachmentArg.hash) throw new Error("Please provide attachment hash.");

    const oldAttachment =
      this.all.find((a) => a.metadata.hash === attachmentArg.hash) || {};
    let id = oldAttachment.id || getId();

    const noteIds = oldAttachment.noteIds || [];
    if (noteId && !noteIds.includes(noteId)) noteIds.push(noteId);

    const attachment = {
      ...oldAttachment,
      ...oldAttachment.metadata,
      ...attachmentArg,
      noteIds
    };

    const {
      iv,
      length,
      alg,
      hash,
      hashType,
      filename,
      salt,
      type,
      chunkSize,
      key
    } = attachment;

    if (
      !iv ||
      !length ||
      !alg ||
      !hash ||
      !hashType ||
      !filename ||
      !salt ||
      !chunkSize ||
      !key
    ) {
      console.error(
        "Attachment is invalid because all properties are required:",
        attachment
      );
      // throw new Error("Could not add attachment: all properties are required.");
      return;
    }

    const encryptedKey = attachmentArg.key
      ? await this._encryptKey(attachmentArg.key)
      : key;
    const attachmentItem = {
      type: "attachment",
      id,
      noteIds,
      iv,
      salt,
      length,
      alg,
      key: encryptedKey,
      chunkSize,
      metadata: {
        hash,
        hashType,
        filename: getFileNameWithExtension(filename, type),
        type: type || "application/octet-stream"
      },
      dateCreated: attachment.dateCreated || Date.now(),
      dateModified: attachment.dateModified,
      dateUploaded: attachment.dateUploaded,
      dateDeleted: undefined,
      failed: attachment.failed
    };
    return this._collection.addItem(attachmentItem);
  }

  async generateKey() {
    await this._getEncryptionKey();
    return await this._db.storage.generateRandomKey();
  }

  async decryptKey(key) {
    const encryptionKey = await this._getEncryptionKey();
    const plainData = await this._db.storage.decrypt(encryptionKey, key);
    return JSON.parse(plainData);
  }

  async delete(hashOrId, noteId) {
    const attachment = this.attachment(hashOrId);
    if (!attachment || !deleteItem(attachment.noteIds, noteId)) return;
    if (!attachment.noteIds.length) {
      attachment.dateDeleted = Date.now();
      EV.publish(EVENTS.attachmentDeleted, attachment);
    }
    return await this._collection.updateItem(attachment);
  }

  async remove(hashOrId, localOnly) {
    const attachment = this.attachment(hashOrId);
    if (!attachment) return false;

    if (!localOnly && !(await this._canDetach(attachment)))
      throw new Error("This attachment is inside a locked note.");

    if (await this._db.fs.deleteFile(attachment.metadata.hash, localOnly)) {
      if (!localOnly) {
        await this.detach(attachment);
      }
      await this._collection.removeItem(attachment.id);
      return true;
    }
    return false;
  }

  async detach(attachment) {
    await this._db.notes.init();
    for (const noteId of attachment.noteIds) {
      const note = this._db.notes.note(noteId);
      if (!note) continue;
      const contentId = note.data.contentId;
      await this._db.content.removeAttachments(contentId, [
        attachment.metadata.hash
      ]);
    }
  }

  async _canDetach(attachment) {
    await this._db.notes.init();
    for (const noteId of attachment.noteIds) {
      const note = this._db.notes.note(noteId);
      if (note && note.data.locked) return false;
    }

    return true;
  }

  /**
   * Get specified type of attachments of a note
   * @param {string} noteId
   * @param {"files"|"images"|"webclips"|"all"} type
   * @returns {Array}
   */
  ofNote(noteId, type) {
    let attachments = [];

    if (type === "files") attachments = this.files;
    else if (type === "images") attachments = this.images;
    else if (type === "webclips") attachments = this.webclips;
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
   * @param {"base64" | "text"} outputType
   * @returns {Promise<string>} dataurl formatted string
   */
  async read(hash, outputType) {
    const attachment = this.all.find((a) => a.metadata.hash === hash);
    if (!attachment) return;

    const key = await this.decryptKey(attachment.key);
    const data = await this._db.fs.readEncrypted(
      attachment.metadata.hash,
      key,
      {
        chunkSize: attachment.chunkSize,
        iv: attachment.iv,
        salt: attachment.salt,
        length: attachment.length,
        alg: attachment.alg,
        outputType
      }
    );
    if (!data) return;

    return outputType === "base64"
      ? dataurl.fromObject({ type: attachment.metadata.type, data })
      : data;
  }

  attachment(hashOrId) {
    return this.all.find(
      (a) => a.id === hashOrId || a.metadata.hash === hashOrId
    );
  }

  markAsUploaded(id) {
    const attachment = this.attachment(id);
    if (!attachment) return;
    attachment.dateUploaded = Date.now();
    attachment.failed = undefined;
    return this._collection.updateItem(attachment);
  }

  reset(id) {
    const attachment = this.attachment(id);
    if (!attachment) return;
    attachment.dateUploaded = undefined;
    return this._collection.updateItem(attachment);
  }

  markAsFailed(id, reason) {
    const attachment = this.attachment(id);
    if (!attachment) return;
    attachment.failed = reason;
    return this._collection.updateItem(attachment);
  }

  async save(data, mimeType) {
    const { hash } = await this._db.fs.hashBase64(data);
    const attachment = this.attachment(hash);
    if (attachment)
      return {
        metadata: attachment.metadata
      };

    const key = await this._db.attachments.generateKey();
    const metadata = await this._db.fs.writeEncryptedBase64(
      data,
      key,
      mimeType
    );
    return { key, metadata };
  }

  async downloadMedia(noteId, hashesToLoad) {
    const attachments = this.media.filter(
      (attachment) =>
        hasItem(attachment.noteIds, noteId) &&
        (!hashesToLoad || hasItem(hashesToLoad, attachment.metadata.hash))
    );

    try {
      for (let i = 0; i < attachments.length; i++) {
        const attachment = attachments[i];
        await this._download(attachment, {
          total: attachments.length,
          current: i,
          groupId: noteId
        });
      }
    } finally {
      sendAttachmentsProgressEvent("download", noteId, attachments.length);
    }
  }

  async _download(attachment, { total, current, groupId }, notify = true) {
    const { metadata, chunkSize } = attachment;
    const filename = metadata.hash;

    sendAttachmentsProgressEvent("download", groupId, total, current);
    const isDownloaded = await this._db.fs.downloadFile(
      groupId,
      filename,
      chunkSize,
      metadata
    );
    if (!isDownloaded) return;

    const src = await this.read(metadata.hash, getOutputType(attachment));
    if (!src) return;

    if (notify)
      EV.publish(EVENTS.mediaAttachmentDownloaded, {
        groupId,
        hash: metadata.hash,
        attachmentType: getAttachmentType(attachment),
        src
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

  get uploaded() {
    return this.all.filter((attachment) => attachment.dateUploaded > 0);
  }

  get syncable() {
    return this._collection
      .getRaw()
      .filter(
        (attachment) => attachment.dateUploaded > 0 || attachment.deleted
      );
  }

  get deleted() {
    return this.all.filter((attachment) => attachment.dateDeleted > 0);
  }

  get images() {
    return this.all.filter((attachment) => isImage(attachment.metadata.type));
  }

  get webclips() {
    return this.all.filter((attachment) => isWebClip(attachment.metadata.type));
  }

  get media() {
    return this.all.filter(
      (attachment) =>
        isImage(attachment.metadata.type) || isWebClip(attachment.metadata.type)
    );
  }

  get files() {
    return this.all.filter(
      (attachment) =>
        !isImage(attachment.metadata.type) &&
        !isWebClip(attachment.metadata.type)
    );
  }

  /**
   * @returns {any[]}
   */
  get all() {
    return this._collection.getItems();
  }

  /**
   * @private
   */
  async _encryptKey(key) {
    const encryptionKey = await this._getEncryptionKey();
    const encryptedKey = await this._db.storage.encrypt(
      encryptionKey,
      JSON.stringify(key)
    );
    return encryptedKey;
  }

  /**
   * @private
   */
  async _getEncryptionKey() {
    this.key = await this._db.user.getAttachmentsKey();
    if (!this.key)
      throw new Error(
        "Failed to get user encryption key. Cannot cache attachments."
      );
    return this.key;
  }
}

function getOutputType(attachment) {
  if (attachment.metadata.type === "application/vnd.notesnook.web-clip")
    return "text";
  else if (attachment.metadata.type.startsWith("image/")) return "base64";
}

function getAttachmentType(attachment) {
  if (attachment.metadata.type === "application/vnd.notesnook.web-clip")
    return "webclip";
  else if (attachment.metadata.type.startsWith("image/")) return "image";
  else return "generic";
}
