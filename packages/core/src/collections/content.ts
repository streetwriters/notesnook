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
import { getContentFromData } from "../content-types";
import { hasItem } from "../utils/array";
import { ResolveHashes } from "../content-types/tiptap";
import { isCipher } from "../database/crypto";
import {
  Attachment,
  ContentItem,
  ContentType,
  EncryptedContentItem,
  MaybeDeletedItem,
  UnencryptedContentItem,
  isDeleted
} from "../types";
import { IndexedCollection } from "../database/indexed-collection";
import Database from "../api";
import { getOutputType } from "./attachments";

export const EMPTY_CONTENT = (noteId: string): UnencryptedContentItem => ({
  noteId,
  dateCreated: Date.now(),
  dateEdited: Date.now(),
  dateModified: Date.now(),
  id: getId(),
  localOnly: true,
  type: "tiptap",
  data: "<p></p>"
});

export class Content implements ICollection {
  name = "content";
  readonly collection: IndexedCollection<"content", ContentItem>;
  constructor(private readonly db: Database) {
    this.collection = new IndexedCollection(
      db.storage,
      "content",
      db.eventManager
    );
  }

  async init() {
    await this.collection.init();
  }

  async merge(content: MaybeDeletedItem<ContentItem>) {
    return await this.collection.addItem(
      isDeleted(content) || !isUnencryptedContent(content)
        ? content
        : await this.extractAttachments(content)
    );
  }

  async add(content: Partial<ContentItem>) {
    if (typeof content.data === "object") {
      if ("data" in content.data && typeof content.data.data === "string")
        content.data = content.data.data;
      else if (!content.data.iv && !content.data.cipher)
        content.data = `<p>Content is invalid: ${JSON.stringify(
          content.data
        )}</p>`;
    }

    if (content.remote)
      throw new Error(
        "Please use db.content.merge for merging remote content."
      );

    const oldContent = content.id ? await this.raw(content.id) : undefined;
    if (content.id && oldContent) {
      content = {
        ...oldContent,
        ...content
      };
    }
    if (!content.noteId) return;
    const id = content.id || getId();

    const contentItem: ContentItem = {
      noteId: content.noteId,
      id,
      type: content.type || "tiptap",
      data: content.data || "<p></p>",
      dateEdited: content.dateEdited || Date.now(),
      dateCreated: content.dateCreated || Date.now(),
      dateModified: content.dateModified || Date.now(),
      localOnly: !!content.localOnly,
      conflicted: content.conflicted,
      dateResolved: content.dateResolved
    };
    await this.collection.addItem(
      isUnencryptedContent(contentItem)
        ? await this.extractAttachments(contentItem)
        : contentItem
    );

    if (content.sessionId) {
      await this.db.noteHistory?.add(
        contentItem.noteId,
        content.sessionId,
        isCipher(contentItem.data),
        {
          data: contentItem.data,
          type: contentItem.type
        }
      );
    }
    return id;
  }

  async get(id: string) {
    const content = await this.raw(id);
    if (!content || isDeleted(content)) return;
    return content;
  }

  async raw(id: string) {
    const content = await this.collection.getItem(id);
    if (!content) return;
    return content;
  }

  remove(id: string) {
    if (!id) return;
    return this.collection.removeItem(id);
  }

  multi(ids: string[]) {
    return this.collection.getItems(ids);
  }

  exists(id: string) {
    return this.collection.exists(id);
  }

  async all() {
    return Object.values(
      await this.collection.getItems(this.collection.indexer.indices)
    );
  }

  insertMedia(contentItem: UnencryptedContentItem) {
    return this.insert(contentItem, async (hashes) => {
      const sources: Record<string, string> = {};
      for (const hash of hashes) {
        const src = await this.db.attachments.read(hash, "base64");
        if (!src) continue;
        sources[hash] = src;
      }
      return sources;
    });
  }

  insertPlaceholders(contentItem: UnencryptedContentItem, placeholder: string) {
    return this.insert(contentItem, async (hashes) => {
      return Object.fromEntries(hashes.map((h) => [h, placeholder]));
    });
  }

  async downloadMedia(
    groupId: string,
    contentItem: { type: ContentType; data: string },
    notify = true
  ) {
    const content = getContentFromData(contentItem.type, contentItem.data);
    if (!content) return contentItem;
    contentItem.data = await content.insertMedia(async (hashes) => {
      const attachments = hashes.reduce((attachments, hash) => {
        const attachment = this.db.attachments.attachment(hash);
        if (!attachment) return attachments;
        attachments.push(attachment);
        return attachments;
      }, [] as Attachment[]);

      await this.db.fs().queueDownloads(
        attachments.map((a) => ({
          filename: a.metadata.hash,
          metadata: a.metadata,
          chunkSize: a.chunkSize
        })),
        groupId,
        notify ? { readOnDownload: false } : undefined
      );

      const sources: Record<string, string> = {};
      for (const attachment of attachments) {
        const src = await this.db.attachments.read(
          attachment.metadata.hash,
          getOutputType(attachment)
        );
        if (!src) continue;
        sources[attachment.metadata.hash] = src;
      }
      return sources;
    });
    return contentItem;
  }

  private async insert(
    contentItem: UnencryptedContentItem,
    getData: ResolveHashes
  ) {
    const content = getContentFromData(contentItem.type, contentItem.data);
    if (!content) return contentItem;
    contentItem.data = await content.insertMedia(getData);
    return contentItem;
  }

  async removeAttachments(id: string, hashes: string[]) {
    const contentItem = await this.raw(id);
    if (!contentItem || isDeleted(contentItem) || isCipher(contentItem.data))
      return;
    const content = getContentFromData(contentItem.type, contentItem.data);
    if (!content) return;
    contentItem.data = content.removeAttachments(hashes);
    await this.add(contentItem);
  }

  async extractAttachments(contentItem: UnencryptedContentItem) {
    if (contentItem.localOnly) return contentItem;

    const allAttachments = this.db.attachments?.all;
    const content = getContentFromData(contentItem.type, contentItem.data);
    if (!content) return contentItem;
    const { data, hashes } = await content.extractAttachments(
      this.db.attachments.save
    );

    const noteAttachments = allAttachments.filter((attachment) =>
      hasItem(attachment.noteIds, contentItem.noteId)
    );

    const toDelete = noteAttachments.filter((attachment) => {
      return hashes.every((hash) => hash !== attachment.metadata.hash);
    });

    const toAdd = hashes.filter((hash) => {
      return hash && noteAttachments.every((a) => hash !== a.metadata.hash);
    });

    for (const attachment of toDelete) {
      await this.db.attachments.delete(
        attachment.metadata.hash,
        contentItem.noteId
      );
    }

    for (const hash of toAdd) {
      await this.db.attachments.add({
        noteIds: [contentItem.noteId],
        metadata: { hash }
      });
    }

    if (toAdd.length > 0) {
      contentItem.dateModified = Date.now();
    }
    contentItem.data = data;
    return contentItem;
  }

  async cleanup() {
    const indices = this.collection.indexer.indices;
    await this.db.notes.init();
    const notes = this.db.notes.all;
    if (!notes.length && indices.length > 0) return [];
    const ids = [];
    for (const contentId of indices) {
      const noteIndex = notes.findIndex((note) => note.contentId === contentId);
      const isOrphaned = noteIndex === -1;
      if (isOrphaned) {
        ids.push(contentId);
        await this.collection.deleteItem(contentId);
      } else if (notes[noteIndex].localOnly) {
        ids.push(contentId);
      }
    }
    return ids;
  }
}

export function isUnencryptedContent(
  content: ContentItem
): content is UnencryptedContentItem {
  return !isCipher(content.data);
}

export function isEncryptedContent(
  content: ContentItem
): content is EncryptedContentItem {
  return isCipher(content.data);
}
