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

import { tinyToTiptap } from "../migrations.js";
import { makeSessionContentId } from "../utils/id.js";
import { ICollection } from "./collection.js";
import { isCipher } from "../utils/crypto.js";
import Database from "../api/index.js";
import { NoteContent, SessionContentItem, isDeleted } from "../types.js";
import { SQLCollection } from "../database/sql-collection.js";

export class SessionContent implements ICollection {
  name = "sessioncontent";
  readonly collection: SQLCollection<"sessioncontent", SessionContentItem>;
  constructor(private readonly db: Database) {
    this.collection = new SQLCollection(
      db.sql,
      db.transaction,
      "sessioncontent",
      db.eventManager,
      db.sanitizer
    );
  }

  async init() {
    await this.collection.init();
  }

  async add<TLocked extends boolean>(
    sessionId: string,
    content: Partial<NoteContent<TLocked>> & { title?: string },
    locked?: TLocked
  ) {
    if (!sessionId || !content) return;
    // const data =
    //   locked || isCipher(content.data)
    //     ? content.data
    //     :  await this.db.compressor().compress(content.data);

    const sessionContentItemId = makeSessionContentId(sessionId);
    const sessionItem: Partial<SessionContentItem> = {
      type: "sessioncontent",
      id: sessionContentItemId,
      compressed: false,
      localOnly: true,
      locked: locked || false,
      dateCreated: Date.now(),
      dateModified: Date.now()
    };

    if (content.data && content.type) {
      sessionItem.data = content.data;
      sessionItem.contentType = content.type;
    }

    if (content.title) {
      sessionItem.title = content.title;
    }

    if (await this.collection.exists(sessionContentItemId)) {
      this.collection.update([sessionContentItemId], sessionItem);
    } else {
      await this.collection.upsert(sessionItem as SessionContentItem);
    }
  }

  async get(
    sessionContentId: string
  ): Promise<Partial<NoteContent<boolean> & { title: string }> | undefined> {
    const session = await this.collection.get(sessionContentId);
    if (!session || isDeleted(session)) return;

    const compressor = await this.db.compressor();
    if (
      session.contentType === "tiny" &&
      session.compressed &&
      !session.locked &&
      !isCipher(session.data)
    ) {
      session.data = await compressor.compress(
        tinyToTiptap(await compressor.decompress(session.data))
      );
      session.contentType = "tiptap";
      await this.collection.upsert(session);
    }

    return {
      data:
        session.compressed && !isCipher(session.data)
          ? await compressor.decompress(session.data)
          : session.data,
      type: session.contentType,
      title: session.title
    };
  }

  async remove(sessionContentId: string) {
    await this.collection.delete([sessionContentId]);
  }

  // async all() {
  //   const indices = this.collection.indexer.indices;
  //   const items = await this.collection.getItems(indices);

  //   return Object.values(items);
  // }
}
