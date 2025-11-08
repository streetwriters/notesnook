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

import http from "../utils/http.js";
import Constants from "../utils/constants.js";
import Database from "./index.js";
import { Monograph, Note, isDeleted } from "../types.js";
import { Cipher } from "@notesnook/crypto";
import { isFalse } from "../database/index.js";

type MonographApiRequestBase = Omit<
  Monograph,
  "type" | "dateModified" | "dateCreated" | "datePublished"
>;
type UnencryptedMonograph = MonographApiRequestBase & {
  content: string;
};
type EncryptedMonograph = MonographApiRequestBase & {
  encryptedContent: Cipher<"base64">;
};
type MonographApiRequest = (UnencryptedMonograph | EncryptedMonograph) & {
  userId: string;
};
export type MonographAnalytics = {
  totalViews: number;
};

export type PublishOptions = { password?: string; selfDestruct?: boolean };
export class Monographs {
  monographs: string[] = [];
  constructor(private readonly db: Database) {}

  async clear() {
    this.monographs = [];
    await this.db.monographsCollection.collection.clear();
  }

  async refresh() {
    const ids = await this.db.monographsCollection.all.ids();
    this.monographs = ids;
  }

  /**
   * Check if note is published.
   */
  isPublished(noteId: string) {
    return this.monographs && this.monographs.indexOf(noteId) > -1;
  }

  /**
   * Get note published monograph id
   */
  monograph(noteId: string) {
    return this.monographs[this.monographs.indexOf(noteId)];
  }

  /**
   * Publish a note as a monograph
   */
  async publish(noteId: string, opts: PublishOptions = {}) {
    if (!this.monographs.length) await this.refresh();

    const update = !!this.isPublished(noteId);

    const user = await this.db.user.getUser();
    const token = await this.db.tokenManager.getAccessToken();
    if (!user || !token) throw new Error("Please login to publish a note.");

    const note = await this.db.notes.note(noteId);
    if (!note) throw new Error("No such note found.");
    if (!note.contentId) throw new Error("Cannot publish an empty note.");

    const contentItem = await this.db.content.get(note.contentId);

    if (!contentItem || isDeleted(contentItem))
      throw new Error("Could not find content for this note.");

    if (contentItem.locked) throw new Error("Cannot published locked notes.");

    const content = await this.db.content.downloadMedia(
      `monograph-${noteId}`,
      contentItem,
      false
    );

    const monographPasswordsKey = await this.db.user.getMonographPasswordsKey();
    const monograph: MonographApiRequest = {
      id: noteId,
      title: note.title,
      userId: user.id,
      selfDestruct: opts.selfDestruct || false,
      ...(opts.password
        ? {
            password: monographPasswordsKey
              ? await this.db
                  .storage()
                  .encrypt(monographPasswordsKey, opts.password)
              : undefined,
            encryptedContent: await this.db
              .storage()
              .encrypt(
                { password: opts.password },
                JSON.stringify({ type: content.type, data: content.data })
              )
          }
        : {
            password: undefined,
            content: JSON.stringify({
              type: content.type,
              data: content.data
            })
          })
    };

    const method = update ? http.patch.json : http.post.json;
    const deviceId = await this.db.kv().read("deviceId");
    const { id, datePublished } = await method(
      `${Constants.API_HOST}/monographs?deviceId=${deviceId}`,
      monograph,
      token
    );

    this.monographs.push(id);
    await this.db.monographsCollection.add({
      id,
      title: monograph.title,
      selfDestruct: monograph.selfDestruct,
      datePublished: datePublished,
      password: monograph.password
    });
    return id;
  }

  /**
   * Unpublish a note
   */
  async unpublish(noteId: string) {
    if (!this.monographs.length) await this.refresh();

    const user = await this.db.user.getUser();
    const token = await this.db.tokenManager.getAccessToken();
    if (!user || !token) throw new Error("Please login to publish a note.");

    if (!this.isPublished(noteId))
      throw new Error("This note is not published.");

    const deviceId = await this.db.kv().read("deviceId");
    await http.delete(
      `${Constants.API_HOST}/monographs/${noteId}?deviceId=${deviceId}`,
      token
    );

    this.monographs.splice(this.monographs.indexOf(noteId), 1);
    await this.db.monographsCollection.collection.softDelete([noteId]);
  }

  get all() {
    return this.db.notes.collection.createFilter<Note>(
      (qb) =>
        qb
          .where(isFalse("dateDeleted"))
          .where(isFalse("deleted"))
          .where("id", "in", this.monographs),
      this.db.options?.batchSize
    );
  }

  get(monographId: string) {
    return this.db.monographsCollection.collection.get(monographId);
  }

  async decryptPassword(password: Cipher<"base64">) {
    const monographPasswordsKey = await this.db.user.getMonographPasswordsKey();
    if (!monographPasswordsKey) return "";
    return this.db.storage().decrypt(monographPasswordsKey, password);
  }

  async analytics(monographId: string): Promise<MonographAnalytics> {
    try {
      const token = await this.db.tokenManager.getAccessToken();
      const analytics = (await http.get(
        `${Constants.API_HOST}/monographs/${monographId}/analytics`,
        token
      )) as MonographAnalytics;
      return analytics;
    } catch {
      return { totalViews: 0 };
    }
  }
}
