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

import Database from "../api";
import { isCipher } from "../database/crypto";
import { SQLCollection } from "../database/sql-collection";
import { ContentItem, HistorySession, isDeleted } from "../types";
import { makeSessionContentId } from "../utils/id";
import { ICollection } from "./collection";
import { SessionContent } from "./session-content";

export class NoteHistory implements ICollection {
  name = "notehistory";
  versionsLimit = 100;
  sessionContent = new SessionContent(this.db);
  readonly collection: SQLCollection<"notehistory", HistorySession>;
  constructor(private readonly db: Database) {
    this.collection = new SQLCollection(db.sql, "notehistory", db.eventManager);
  }

  async init() {
    await this.collection.init();
    await this.sessionContent.init();
  }

  async get(noteId: string, order: "asc" | "desc" = "desc") {
    if (!noteId) return [];

    // const indices = this.collection.indexer.indices;
    // const sessionIds = indices.filter((id) => id.startsWith(noteId));
    // if (sessionIds.length === 0) return [];
    // const history = await this.getSessions(sessionIds);

    // return history.sort(function (a, b) {
    //   return b.dateModified - a.dateModified;
    // });
    const history = await this.db
      .sql()
      .selectFrom("notehistory")
      .where("noteId", "==", noteId)
      .orderBy(`dateModified ${order}`)
      .selectAll()
      .execute();
    return history as HistorySession[];
  }

  async add(sessionId: string, content: ContentItem) {
    const { noteId, locked } = content;
    sessionId = `${noteId}_${sessionId}`;
    const oldSession = await this.collection.get(sessionId);

    if (oldSession && isDeleted(oldSession)) return;

    const session: HistorySession = {
      type: "session",
      id: sessionId,
      sessionContentId: makeSessionContentId(sessionId),
      noteId,
      dateCreated: oldSession ? oldSession.dateCreated : Date.now(),
      dateModified: Date.now(),
      localOnly: true,
      locked
    };

    await this.collection.upsert(session);
    await this.sessionContent.add(sessionId, content, locked);
    await this.cleanup(noteId);

    return session;
  }

  private async cleanup(noteId: string, limit = this.versionsLimit) {
    const history = await this.get(noteId, "asc");
    if (history.length === 0 || history.length < limit) return;
    const deleteCount = history.length - limit;
    for (let i = 0; i < deleteCount; i++) {
      const session = history[i];
      await this._remove(session);
    }
  }

  async content(sessionId: string) {
    const session = await this.collection.get(sessionId);
    if (!session || isDeleted(session)) return;
    return await this.sessionContent.get(session.sessionContentId);
  }

  async remove(sessionId: string) {
    const session = await this.collection.get(sessionId);
    if (!session || isDeleted(session)) return;
    await this._remove(session);
  }

  async clearSessions(...noteIds: string[]) {
    await this.db.transaction(async () => {
      const deletedIds = await this.db
        .sql()
        .deleteFrom("notehistory")
        .where("noteId", "in", noteIds)
        .returning("sessionContentId as sessionContentId")
        .execute();
      await this.db
        .sql()
        .deleteFrom("sessioncontent")
        .where(
          "id",
          "in",
          deletedIds.reduce((arr, item) => {
            if (item.sessionContentId && !arr.includes(item.sessionContentId))
              arr.push(item.sessionContentId);
            return arr;
          }, [] as string[])
        )
        .execute();
    });
  }

  private async _remove(session: HistorySession) {
    await this.collection.delete([session.id]);
    await this.sessionContent.remove(session.sessionContentId);
  }

  async restore(sessionId: string) {
    const session = await this.collection.get(sessionId);
    if (!session || isDeleted(session)) return;

    const content = await this.sessionContent.get(session.sessionContentId);
    const note = await this.db.notes.note(session.noteId);
    if (!note || !content) return;

    if (session.locked && isCipher(content.data)) {
      await this.db.content.add({
        id: note.contentId,
        data: content.data,
        type: content.type
      });
    } else if (content.data && !isCipher(content.data)) {
      await this.db.notes.add({
        id: session.noteId,
        content: {
          data: content.data,
          type: content.type
        }
      });
    }
  }

  // async all() {
  //   return this.getSessions(this.collection.indexer.indices);
  // }

  // private async getSessions(sessionIds: string[]): Promise<HistorySession[]> {
  //   const items = await this.collection.getItems(sessionIds);
  //   return Object.values(items).filter(
  //     (a) => !isDeleted(a)
  //   ) as HistorySession[];
  // }
}
