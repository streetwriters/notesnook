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

import { ICollection } from "./collection";
import { getId } from "../utils/id";
import { hasItem } from "../utils/array";
import { EV, EVENTS } from "../common";
import dataurl from "../utils/dataurl";
import dayjs from "dayjs";
import {
  getFileNameWithExtension,
  isImage,
  isWebClip
} from "../utils/filename";
import { Cipher, DataFormat, SerializedKey } from "@notesnook/crypto";
import { CachedCollection } from "../database/cached-collection";
import { Output } from "../interfaces";
import { Attachment, AttachmentMetadata, isDeleted } from "../types";
import Database from "../api";

export class Attachments implements ICollection {
  name = "attachments";
  key: Cipher<"base64"> | null = null;
  readonly collection: CachedCollection<"attachments", Attachment>;
  constructor(private readonly db: Database) {
    this.collection = new CachedCollection(
      db.storage,
      "attachments",
      db.eventManager
    );
    this.key = null;

    EV.subscribe(
      EVENTS.fileDownloaded,
      async ({
        success,
        filename,
        groupId,
        eventData
      }: {
        success: boolean;
        filename: string;
        groupId: string;
        eventData: Record<string, unknown>;
      }) => {
        if (!success || !eventData || !eventData.readOnDownload) return;
        const attachment = this.attachment(filename);
        if (!attachment) return;

        const src = await this.read(filename, getOutputType(attachment));
        if (!src) return;

        EV.publish(EVENTS.mediaAttachmentDownloaded, {
          groupId,
          hash: attachment.metadata.hash,
          attachmentType: getAttachmentType(attachment),
          src
        });
      }
    );

    EV.subscribe(
      EVENTS.fileUploaded,
      async ({
        success,
        error,
        filename
      }: {
        success: boolean;
        filename: string;
        error: string;
      }) => {
        const attachment = this.attachment(filename);
        if (!attachment) return;
        if (success) await this.markAsUploaded(attachment.id);
        else
          await this.markAsFailed(
            attachment.id,
            error || "Failed to upload attachment."
          );
      }
    );
  }

  async init() {
    await this.collection.init();
  }

  async add(
    item: Partial<
      Omit<Attachment, "key" | "metadata"> & {
        key: SerializedKey;
      }
    > & {
      metadata: Partial<AttachmentMetadata> & { hash: string };
    }
  ) {
    if (!item) return console.error("attachment cannot be undefined");
    if (!item.metadata.hash) throw new Error("Please provide attachment hash.");

    const oldAttachment = this.all.find(
      (a) => a.metadata.hash === item.metadata?.hash
    );
    const id = oldAttachment?.id || getId();

    const encryptedKey = item.key
      ? await this.encryptKey(item.key)
      : oldAttachment?.key;
    const attachment = {
      ...oldAttachment,
      ...oldAttachment?.metadata,
      ...item,
      key: encryptedKey
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

    return this.collection.add({
      type: "attachment",
      id,
      iv,
      salt,
      length,
      alg,
      key,
      chunkSize,
      metadata: {
        hash,
        hashType,
        filename: getFileNameWithExtension(filename, type),
        type: type || "application/octet-stream"
      },
      dateCreated: attachment.dateCreated || Date.now(),
      dateModified: attachment.dateModified || Date.now(),
      dateUploaded: attachment.dateUploaded,
      dateDeleted: undefined,
      failed: attachment.failed
    });
  }

  async generateKey() {
    await this._getEncryptionKey();
    return await this.db.crypto().generateRandomKey();
  }

  async decryptKey(key: Cipher<"base64">): Promise<SerializedKey | null> {
    const encryptionKey = await this._getEncryptionKey();
    const plainData = await this.db.storage().decrypt(encryptionKey, key);
    if (!plainData) return null;
    return JSON.parse(plainData);
  }

  async remove(hashOrId: string, localOnly: boolean) {
    const attachment = this.attachment(hashOrId);
    if (!attachment) return false;

    if (!localOnly && !(await this.canDetach(attachment)))
      throw new Error("This attachment is inside a locked note.");

    if (
      await this.db
        .fs()
        .deleteFile(
          attachment.metadata.hash,
          localOnly || !attachment.dateUploaded
        )
    ) {
      if (!localOnly) {
        await this.detach(attachment);
      }
      await this.collection.remove(attachment.id);
      return true;
    }
    return false;
  }

  async detach(attachment: Attachment) {
    for (const note of this.db.relations.from(attachment, "note").resolved()) {
      if (!note || !note.contentId) continue;
      await this.db.content.removeAttachments(note.contentId, [
        attachment.metadata.hash
      ]);
    }
  }

  private async canDetach(attachment: Attachment) {
    return this.db.relations
      .from(attachment, "note")
      .resolved()
      .every((note) => !note.locked);
  }

  ofNote(
    noteId: string,
    ...types: ("files" | "images" | "webclips" | "all")[]
  ): Attachment[] {
    const noteAttachments = this.db.relations
      .from({ type: "note", id: noteId }, "attachment")
      .resolved();

    if (types.includes("all")) return noteAttachments;

    return noteAttachments.filter((a) => {
      if (isImage(a.metadata.type) && types.includes("images")) return true;
      else if (isWebClip(a.metadata.type) && types.includes("webclips"))
        return true;
      else if (types.includes("files")) return true;
    });
  }

  exists(hash: string) {
    const attachment = this.all.find((a) => a.metadata.hash === hash);
    return !!attachment;
  }

  async read<TOutputFormat extends DataFormat>(
    hash: string,
    outputType: TOutputFormat
  ): Promise<Output<TOutputFormat> | undefined> {
    const attachment = this.all.find((a) => a.metadata.hash === hash);
    if (!attachment) return;

    const key = await this.decryptKey(attachment.key);
    if (!key) return;
    const data = await this.db
      .fs()
      .readEncrypted(attachment.metadata.hash, key, {
        chunkSize: attachment.chunkSize,
        iv: attachment.iv,
        salt: attachment.salt,
        length: attachment.length,
        alg: attachment.alg,
        outputType
      });
    if (!data) return;

    return (
      outputType === "base64"
        ? dataurl.fromObject({
            type: attachment.metadata.type,
            data
          })
        : data
    ) as Output<TOutputFormat>;
  }

  attachment(hashOrId: string) {
    return this.all.find(
      (a) => a.id === hashOrId || a.metadata.hash === hashOrId
    );
  }

  markAsUploaded(id: string) {
    const attachment = this.attachment(id);
    if (!attachment) return;
    attachment.dateUploaded = Date.now();
    attachment.failed = undefined;
    return this.collection.update(attachment);
  }

  reset(id: string) {
    const attachment = this.attachment(id);
    if (!attachment) return;
    attachment.dateUploaded = undefined;
    return this.collection.update(attachment);
  }

  markAsFailed(id: string, reason: string) {
    const attachment = this.attachment(id);
    if (!attachment) return;
    attachment.failed = reason;
    return this.collection.update(attachment);
  }

  async save(
    data: string,
    mimeType: string,
    filename?: string
  ): Promise<string | undefined> {
    const hashResult = await this.db.fs().hashBase64(data);
    if (!hashResult) return;
    if (this.exists(hashResult.hash)) return hashResult.hash;

    const key = await this.generateKey();
    const { hash, hashType, ...encryptionMetadata } = await this.db
      .fs()
      .writeEncryptedBase64(data, key, mimeType);

    await this.add({
      ...encryptionMetadata,
      key,
      metadata: {
        filename: filename || hash,
        hash,
        hashType,
        type: mimeType || "application/octet-stream"
      }
    });
    return hash;
  }

  async downloadMedia(noteId: string, hashesToLoad?: string[]) {
    let attachments = this.ofNote(noteId, "images", "webclips");
    if (hashesToLoad)
      attachments = attachments.filter((a) =>
        hasItem(hashesToLoad, a.metadata.hash)
      );

    await this.db.fs().queueDownloads(
      attachments.map((a) => ({
        filename: a.metadata.hash,
        metadata: a.metadata,
        chunkSize: a.chunkSize
      })),
      noteId,
      { readOnDownload: true }
    );
  }

  async cleanup() {
    const now = dayjs().unix();
    for (const attachment of this.deleted) {
      if (dayjs(attachment.dateDeleted).add(7, "days").unix() < now) continue;

      const isDeleted = await this.db.fs().deleteFile(attachment.metadata.hash);
      if (!isDeleted) continue;

      await this.collection.remove(attachment.id);
    }
  }

  get pending() {
    return this.all.filter(
      (attachment) => !attachment.dateUploaded || attachment.dateUploaded <= 0
    );
  }

  get uploaded() {
    return this.all.filter((attachment) => !!attachment.dateUploaded);
  }

  get syncable() {
    return this.collection
      .raw()
      .filter(
        (attachment) => isDeleted(attachment) || !!attachment.dateUploaded
      );
  }

  get deleted() {
    return this.all.filter((attachment) => !!attachment.dateDeleted);
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

  get all() {
    return this.collection.items();
  }

  private async encryptKey(key: SerializedKey) {
    const encryptionKey = await this._getEncryptionKey();
    const encryptedKey = await this.db
      .storage()
      .encrypt(encryptionKey, JSON.stringify(key));
    return encryptedKey;
  }

  async _getEncryptionKey() {
    this.key = await this.db.user?.getAttachmentsKey();
    if (!this.key)
      throw new Error(
        "Failed to get user encryption key. Cannot cache attachments."
      );
    return this.key;
  }
}

export function getOutputType(attachment: Attachment): DataFormat {
  if (attachment.metadata.type === "application/vnd.notesnook.web-clip")
    return "text";
  else if (attachment.metadata.type.startsWith("image/")) return "base64";
  return "uint8array";
}

function getAttachmentType(attachment: Attachment) {
  if (attachment.metadata.type === "application/vnd.notesnook.web-clip")
    return "webclip";
  else if (attachment.metadata.type.startsWith("image/")) return "image";
  else return "generic";
}
