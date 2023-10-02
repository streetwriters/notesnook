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

import { Cipher } from "@notesnook/crypto";
import { tinyToTiptap } from "../migrations";
import { makeSessionContentId } from "../utils/id";
import { ICollection } from "./collection";
import { isCipher } from "../database/crypto";
import Database from "../api";
import { ContentType, SessionContentItem, isDeleted } from "../types";
import { SQLCollection } from "../database/sql-collection";

export type NoteContent<TLocked extends boolean> = {
  data: TLocked extends true ? Cipher<"base64"> : string;
  type: ContentType;
};

export class SessionContent implements ICollection {
  name = "sessioncontent";
  private readonly collection: SQLCollection<
    "sessioncontent",
    SessionContentItem
  >;
  constructor(private readonly db: Database) {
    this.collection = new SQLCollection(
      db.sql,
      "sessioncontent",
      db.eventManager
    );
  }

  async init() {
    await this.collection.init();
  }

  async add<TLocked extends boolean>(
    sessionId: string,
    content: NoteContent<TLocked>,
    locked: TLocked
  ) {
    if (!sessionId || !content) return;
    const data =
      locked || isCipher(content.data)
        ? content.data
        : await this.db.compressor().compress(content.data);

    await this.collection.upsert({
      type: "sessioncontent",
      id: makeSessionContentId(sessionId),
      data,
      contentType: content.type,
      compressed: !locked,
      localOnly: true,
      locked,
      dateCreated: Date.now(),
      dateModified: Date.now()
    });
  }

  async get(sessionContentId: string) {
    const session = await this.collection.get(sessionContentId);
    if (!session || isDeleted(session)) return;

    if (
      session.contentType === "tiny" &&
      session.compressed &&
      !session.locked &&
      !isCipher(session.data)
    ) {
      session.data = await this.db
        .compressor()
        .compress(
          tinyToTiptap(await this.db.compressor().decompress(session.data))
        );
      session.contentType = "tiptap";
      await this.collection.upsert(session);
    }

    return {
      data:
        session.compressed && !isCipher(session.data)
          ? await this.db.compressor().decompress(session.data)
          : session.data,
      type: session.contentType
    };
  }

  async remove(sessionContentId: string) {
    await this.collection.delete(sessionContentId);
  }

  // async all() {
  //   const indices = this.collection.indexer.indices;
  //   const items = await this.collection.getItems(indices);

  //   return Object.values(items);
  // }
}
