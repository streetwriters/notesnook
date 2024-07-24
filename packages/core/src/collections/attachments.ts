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
import { EV, EVENTS } from "../common";
import dataurl from "../utils/dataurl";
import dayjs from "dayjs";
import { DocumentMimeTypes, getFileNameWithExtension } from "../utils/filename";
import { Cipher, DataFormat, SerializedKey } from "@notesnook/crypto";
import { Output } from "../interfaces";
import { Attachment } from "../types";
import Database from "../api";
import { FilteredSelector, SQLCollection } from "../database/sql-collection";
import { isFalse } from "../database";
import { sql } from "kysely";
import { logger } from "../logger";

export class Attachments implements ICollection {
  name = "attachments";
  key: Cipher<"base64"> | null = null;
  readonly collection: SQLCollection<"attachments", Attachment>;
  constructor(private readonly db: Database) {
    this.collection = new SQLCollection(
      db.sql,
      db.transaction,
      "attachments",
      db.eventManager,
      db.sanitizer
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
        const attachment = await this.attachment(filename);
        if (!attachment) return;

        const src = await this.read(filename, getOutputType(attachment));
        if (!src) return;

        EV.publish(EVENTS.mediaAttachmentDownloaded, {
          groupId,
          hash: attachment.hash,
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
        const attachment = await this.attachment(filename);
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
      Omit<Attachment, "key" | "encryptionKey"> & {
        key: SerializedKey;
      }
    >
  ) {
    if (!item) throw new Error("attachment cannot be undefined");
    if (!item.hash) throw new Error("Please provide attachment hash.");

    const oldAttachment = await this.attachment(item.hash);
    const id = oldAttachment?.id || getId();

    const encryptedKey = item.key
      ? await this.encryptKey(item.key)
      : oldAttachment?.key;
    const attachment = {
      ...oldAttachment,
      ...item,
      key: encryptedKey
    };

    const {
      iv,
      size,
      alg,
      hash,
      hashType,
      filename,
      mimeType,
      salt,
      chunkSize,
      key
    } = attachment;

    if (
      !iv ||
      !size ||
      !alg ||
      !hash ||
      !hashType ||
      // !filename ||
      //  !mimeType ||
      !salt ||
      !chunkSize ||
      !key
    ) {
      logger.error(
        {},
        "Attachment is invalid because all properties are required:",
        { attachment }
      );
      return;
    }

    await this.collection.upsert({
      type: "attachment",
      id,
      iv,
      salt,
      size,
      alg,
      key,
      chunkSize,

      filename:
        filename ||
        getFileNameWithExtension(
          filename || hash,
          mimeType || "application/octet-stream"
        ),
      hash,
      hashType,
      mimeType: mimeType || "application/octet-stream",

      dateCreated: attachment.dateCreated || Date.now(),
      dateModified: attachment.dateModified || Date.now(),
      dateUploaded: attachment.dateUploaded,
      failed: attachment.failed
    });

    return id;
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
    logger.debug("Removing attachment", { hashOrId, localOnly });
    const attachment = await this.attachment(hashOrId);
    if (!attachment) {
      logger.debug("Attachment not found", { hashOrId, localOnly });
      return false;
    }

    if (!localOnly && !(await this.canDetach(attachment)))
      throw new Error("This attachment is inside a locked note.");

    if (
      await this.db
        .fs()
        .deleteFile(attachment.hash, localOnly || !attachment.dateUploaded)
    ) {
      if (!localOnly) {
        await this.detach(attachment);
      }
      await this.db.relations.unlinkOfType("attachment", [attachment.id]);
      await this.collection.softDelete([attachment.id]);
      return true;
    }
    return false;
  }

  async detach(attachment: Attachment) {
    for (const note of await this.db.relations
      .to(attachment, "note")
      .selector.fields(["notes.contentId"])
      .items()) {
      if (!note.contentId) continue;
      await this.db.content.removeAttachments(note.contentId, [
        attachment.hash
      ]);
    }
  }

  private async canDetach(attachment: Attachment) {
    const linkedNotes = await this.db.relations.to(attachment, "note").get();
    return (
      (await this.db.relations
        .to({ ids: linkedNotes.map((n) => n.toId), type: "note" }, "vault")
        .count()) <= 0
    );
  }

  ofNote(
    noteId: string,
    ...types: (
      | "files"
      | "images"
      | "videos"
      | "audio"
      | "documents"
      | "webclips"
      | "all"
    )[]
  ) {
    const selector = this.db.relations.from(
      { type: "note", id: noteId },
      "attachment"
    ).selector;
    return new FilteredSelector<Attachment>(
      "attachments",
      types.includes("all")
        ? selector.filter
        : selector.filter.where((eb) => {
            const filters = [];
            if (types.includes("images"))
              filters.push(eb("mimeType", "like", `image/%`));

            if (types.includes("videos"))
              filters.push(eb("mimeType", "like", `video/%`));

            if (types.includes("audio"))
              filters.push(eb("mimeType", "like", `audio/%`));

            if (types.includes("documents"))
              filters.push(eb("mimeType", "in", DocumentMimeTypes));

            if (types.includes("webclips"))
              filters.push(
                eb("mimeType", "==", `application/vnd.notesnook.web-clip`)
              );
            if (types.includes("files")) {
              filters.push(
                eb.and([
                  eb("mimeType", "!=", `application/vnd.notesnook.web-clip`),
                  eb("mimeType", "not like", `image/%`)
                ])
              );
            }
            return eb.or(filters);
          })
    );
  }

  async exists(hash: string) {
    return !!(await this.attachment(hash));
  }

  async read<TOutputFormat extends DataFormat>(
    hash: string,
    outputType: TOutputFormat
  ): Promise<Output<TOutputFormat> | undefined> {
    const attachment = await this.attachment(hash);
    if (!attachment) return;

    const key = await this.decryptKey(attachment.key);
    if (!key) return;
    const data = await this.db.fs().readEncrypted(attachment.hash, key, {
      chunkSize: attachment.chunkSize,
      iv: attachment.iv,
      salt: attachment.salt,
      size: attachment.size,
      alg: attachment.alg,
      outputType
    });
    if (!data) return;

    return (
      outputType === "base64" && typeof data === "string"
        ? dataurl.fromObject({
            mimeType: attachment.mimeType,
            data
          })
        : data
    ) as Output<TOutputFormat>;
  }

  async attachment(hashOrId: string): Promise<Attachment | undefined> {
    const attachment = await this.all.find((eb) =>
      eb.or([eb("id", "==", hashOrId), eb("hash", "==", hashOrId)])
    );
    if (attachment) logger.debug("attachment exists", { hashOrId });
    return attachment;
  }

  markAsUploaded(id: string) {
    return this.collection.update([id], {
      dateUploaded: Date.now(),
      failed: null
    });
  }

  reset(id: string) {
    return this.collection.update([id], {
      dateUploaded: null
    });
  }

  markAsFailed(id: string, reason?: string) {
    return this.collection.update([id], {
      failed: reason
    });
  }

  async save(
    data: string,
    mimeType: string,
    filename?: string
  ): Promise<string | undefined> {
    const hashResult = await this.db.fs().hashBase64(data);
    if (!hashResult) return;
    if (await this.exists(hashResult.hash)) return hashResult.hash;

    const key = await this.generateKey();
    const { hash, hashType, ...encryptionMetadata } = await this.db
      .fs()
      .writeEncryptedBase64(data, key, mimeType);

    await this.add({
      ...encryptionMetadata,
      key,

      filename: filename || hash,
      hash,
      hashType,
      mimeType: mimeType || "application/octet-stream"
    });
    return hash;
  }

  async downloadMedia(noteId: string, hashesToLoad?: string[]) {
    const attachments = this.ofNote(noteId, "images", "webclips").fields([
      "attachments.id",
      "attachments.hash",
      "attachments.chunkSize"
    ]);
    if (hashesToLoad)
      attachments.where((eb) => eb.and([eb("hash", "in", hashesToLoad)]));

    await this.db.fs().queueDownloads(
      (
        await attachments.items()
      ).map((a) => ({
        filename: a.hash,
        chunkSize: a.chunkSize
      })),
      noteId,
      { readOnDownload: true }
    );
  }

  async cleanup() {
    const now = dayjs().unix();
    const ids: string[] = [];
    for await (const attachment of this.deleted) {
      if (dayjs(attachment.dateDeleted).add(7, "days").unix() < now) continue;

      const isDeleted = await this.db.fs().deleteFile(attachment.hash);
      if (!isDeleted) continue;

      ids.push(attachment.id);
    }
    await this.collection.softDelete(ids);
  }

  get pending() {
    return this.collection.createFilter<Attachment>(
      (qb) => qb.where(isFalse("dateUploaded")).where(isFalse("deleted")),
      this.db.options?.batchSize
    );
  }

  // get uploaded() {
  //   return this.all.filter((attachment) => !!attachment.dateUploaded);
  // }

  // get syncable() {
  //   return this.collection
  //     .raw()
  //     .filter(
  //       (attachment) => isDeleted(attachment) || !!attachment.dateUploaded
  //     );
  // }

  get deleted() {
    return this.collection.createFilter<Attachment>(
      (qb) => qb.where("dateDeleted", "is not", null),
      this.db.options?.batchSize
    );
  }

  get images() {
    return this.collection.createFilter<Attachment>(
      (qb) => qb.where(isFalse("deleted")).where("mimeType", "like", `image/%`),
      this.db.options?.batchSize
    );
  }

  get videos() {
    return this.collection.createFilter<Attachment>(
      (qb) => qb.where(isFalse("deleted")).where("mimeType", "like", `video/%`),
      this.db.options?.batchSize
    );
  }

  get audios() {
    return this.collection.createFilter<Attachment>(
      (qb) => qb.where(isFalse("deleted")).where("mimeType", "like", `audio/%`),
      this.db.options?.batchSize
    );
  }

  get documents() {
    return this.collection.createFilter<Attachment>(
      (qb) =>
        qb.where(isFalse("deleted")).where("mimeType", "in", DocumentMimeTypes),
      this.db.options?.batchSize
    );
  }

  get webclips() {
    return this.collection.createFilter<Attachment>(
      (qb) =>
        qb
          .where(isFalse("deleted"))
          .where("mimeType", "==", `application/vnd.notesnook.web-clip`),
      this.db.options?.batchSize
    );
  }

  get orphaned() {
    return this.collection.createFilter<Attachment>(
      (qb) =>
        qb
          .where(isFalse("deleted"))
          .where("id", "not in", (eb) =>
            eb
              .selectFrom("relations")
              .where("toType", "==", "attachment")
              .select("toId as id")
              .$narrowType<{ id: string }>()
          ),
      this.db.options?.batchSize
    );
  }

  get linked() {
    return this.collection.createFilter<Attachment>(
      (qb) =>
        qb
          .where(isFalse("deleted"))
          .where("id", "in", (eb) =>
            eb
              .selectFrom("relations")
              .where("toType", "==", "attachment")
              .select("toId as id")
              .$narrowType<{ id: string }>()
          ),
      this.db.options?.batchSize
    );
  }
  // get media() {
  //   return this.all.filter(
  //     (attachment) =>
  //       isImage(attachment.metadata.type) || isWebClip(attachment.metadata.type)
  //   );
  // }

  // get files() {
  //   return this.all.filter(
  //     (attachment) =>
  //       !isImage(attachment.metadata.type) &&
  //       !isWebClip(attachment.metadata.type)
  //   );
  // }

  get all() {
    return this.collection.createFilter<Attachment>(
      (qb) => qb.where(isFalse("deleted")),
      this.db.options?.batchSize
    );
  }

  async totalSize(selector: FilteredSelector<Attachment> = this.all) {
    const result = await selector.filter
      .select((eb) => eb.fn.sum<number>(sql.raw(`size + 17`)).as("totalSize"))
      .executeTakeFirst();
    return result?.totalSize;
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
  if (attachment.mimeType === "application/vnd.notesnook.web-clip")
    return "text";
  else if (attachment.mimeType.startsWith("image/")) return "base64";
  return "uint8array";
}

function getAttachmentType(attachment: Attachment) {
  if (attachment.mimeType === "application/vnd.notesnook.web-clip")
    return "webclip";
  else if (attachment.mimeType.startsWith("image/")) return "image";
  else return "generic";
}
