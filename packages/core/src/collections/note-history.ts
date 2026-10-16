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

import Database from "../api/index.js";
import { isCipher } from "../utils/crypto.js";
import { FilteredSelector, SQLCollection } from "../database/sql-collection.js";
import { HistorySession, isDeleted, Note, NoteContent } from "../types.js";
import { makeSessionContentId } from "../utils/id.js";
import { logger } from "../logger.js";
import { sql } from "@streetwriters/kysely";
import { ICollection } from "./collection.js";
import { SessionContent } from "./session-content.js";

const CLEANUP_INTERVAL = 60 * 60 * 1000;

export class NoteHistory implements ICollection {
  name = "notehistory";
  sessionContent;
  readonly collection: SQLCollection<"notehistory", HistorySession>;
  constructor(private readonly db: Database) {
    this.sessionContent = new SessionContent(db);
    this.collection = new SQLCollection(
      db.sql,
      "notehistory",
      db.eventManager,
      db.sanitizer
    );
  }

  async init() {
    await this.collection.init();
    await this.sessionContent.init();

    // run cleanup once for logged out users
    if (!(await this.db.user.getUser())) this.cleanupInBackground();
  }

  // async get(noteId: string, order: "asc" | "desc" = "desc") {
  //   if (!noteId) return [];

  //   // const indices = this.collection.indexer.indices;
  //   // const sessionIds = indices.filter((id) => id.startsWith(noteId));
  //   // if (sessionIds.length === 0) return [];
  //   // const history = await this.getSessions(sessionIds);

  //   // return history.sort(function (a, b) {
  //   //   return b.dateModified - a.dateModified;
  //   // });
  // const history = await this.db
  //   .sql()
  //   .selectFrom("notehistory")
  //   .where("noteId", "==", noteId)
  //     .orderBy(`dateModified ${order}`)
  //     .selectAll()
  //     .execute();
  //   return history as HistorySession[];
  // }
  get(noteId: string) {
    return new FilteredSelector<HistorySession>(
      "notehistory",
      this.db.sql().selectFrom("notehistory").where("noteId", "==", noteId)
    );
  }

  async add(
    sessionId: string,
    content: Partial<NoteContent<boolean>> & {
      noteId: string;
      locked?: boolean;
      title?: string;
    }
  ) {
    const { noteId, locked } = content;
    sessionId = `${noteId}_${sessionId}`;

    if (await this.collection.exists(sessionId)) {
      await this.collection.update([sessionId], {
        locked
      });
    } else {
      await this.collection.upsert({
        type: "session",
        id: sessionId,
        sessionContentId: makeSessionContentId(sessionId),
        noteId,
        dateCreated: Date.now(),
        dateModified: Date.now(),
        localOnly: true,
        locked
      });
    }

    await this.sessionContent.add(sessionId, content, locked);

    return sessionId;
  }

  private cleaning?: Promise<void>;
  private lastCleanup = 0;
  /**
   * Trims the history of every note to the limit of the user's plan without
   * blocking the caller. It runs at most once an hour and never twice at the
   * same time. Call it when the plan is known to be up to date.
   */
  cleanupInBackground() {
    if (this.cleaning || Date.now() - this.lastCleanup < CLEANUP_INTERVAL)
      return this.cleaning;

    this.lastCleanup = Date.now();
    this.cleaning = this.cleanup()
      .catch((e) => logger.error(e, "Failed to clean up note history"))
      .finally(() => (this.cleaning = undefined));
    return this.cleaning;
  }

  async cleanup() {
    const limit = await this.db.options.maxNoteVersions();
    if (!limit) return;

    await this.db.transaction(async (tx) => {
      const overLimit = sql`(
        SELECT id, sessionContentId FROM (
          SELECT id, sessionContentId, row_number() OVER (
            PARTITION BY noteId ORDER BY dateModified DESC
          ) AS position
          FROM notehistory
        ) WHERE position > ${limit}
      )`;

      // the contents have to go first, they are found through the sessions
      await sql`DELETE FROM sessioncontent WHERE id IN (
        SELECT sessionContentId FROM ${overLimit}
      )`.execute(tx.sql());
      await sql`DELETE FROM notehistory WHERE id IN (
        SELECT id FROM ${overLimit}
      )`.execute(tx.sql());
    });
  }

  async content(sessionId: string) {
    const session = await this.collection.get(sessionId);
    if (!session || isDeleted(session)) return;
    return await this.sessionContent.get(session.sessionContentId);
  }

  async session(sessionId: string) {
    const session = await this.collection.get(sessionId);
    if (!session || isDeleted(session)) return;
    return session;
  }

  async remove(sessionId: string) {
    const session = await this.collection.get(sessionId);
    if (!session || isDeleted(session)) return;
    await this._remove(session);
  }

  async clearSessions(...noteIds: string[]) {
    await this.db.transaction(async (tx) => {
      const deletedIds = await tx
        .sql()
        .deleteFrom("notehistory")
        .where("noteId", "in", noteIds)
        .returning("sessionContentId as sessionContentId")
        .execute();
      await tx
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

  private async _remove(session: { id: string; sessionContentId: string }) {
    await this.db.transaction(async (tx) => {
      await tx.noteHistory.collection.delete([session.id]);
      await tx.noteHistory.sessionContent.remove(session.sessionContentId);
    });
  }

  async restore(sessionId: string) {
    const session = await this.collection.get(sessionId);
    if (!session || isDeleted(session)) return;

    const content = await this.sessionContent.get(session.sessionContentId);
    const note = await this.db.notes.note(session.noteId);
    if (!note || !content) return;

    if (session.locked && isCipher(content.data)) {
      const sessionId = `${Date.now()}`;
      await this.db.content.add({
        id: note.contentId,
        noteId: session.noteId,
        sessionId: sessionId,
        data: content.data,
        type: content.type
      });

      if (content.title) {
        await this.db.notes.add({
          id: session.noteId,
          sessionId: sessionId,
          title: content.title
        });
      }
    } else {
      const note: Partial<
        Note & {
          content: NoteContent<false>;
          sessionId: string;
        }
      > = {
        id: session.noteId,
        sessionId: `${Date.now()}`
      };

      note.content =
        content.data && content.type && !isCipher(content.data)
          ? {
              data: content.data,
              type: content.type
            }
          : { data: "<p></p>", type: "tiptap" };

      if (content.title) {
        note.title = content.title;
      }

      await this.db.notes.add(note);
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
