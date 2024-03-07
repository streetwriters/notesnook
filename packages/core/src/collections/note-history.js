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

import { makeSessionContentId } from "../utils/id";
import Collection from "./collection";
import SessionContent from "./session-content";
/**
 * @typedef Session
 * @property {string} id
 * @property {string} noteId
 * @property {string} sessionContentId
 * @property {string} dateModified
 * @property {string} dateCreated
 * @property {boolean} locked
 */

/**
 * @typedef Content
 * @property {string} title
 * @property {string} data
 * @property {string} type
 */

export default class NoteHistory extends Collection {
  async init() {
    await super.init();
    this.versionsLimit = 100;

    /**
     * @type {SessionContent}
     */
    this.sessionContent = await SessionContent.new(
      this._db,
      "sessioncontent",
      false
    );
  }

  async merge(item) {
    await this._collection.addItem(item);
  }

  /**
   * Get complete session history of a note.
   * @param noteId id of the note
   * @returns {Promise<Session[]>} An array of session ids of a note
   */
  async get(noteId) {
    if (!noteId) return [];

    let indices = this._collection.indexer.getIndices();
    let sessionIds = indices.filter((id) => id.startsWith(noteId));
    if (sessionIds.length === 0) return [];
    let history = (await this._getSessions(sessionIds)) || [];

    return history.sort(function (a, b) {
      return b.dateModified - a.dateModified;
    });
  }

  /**
   * Add and update a session content
   * @param {string} noteId id of the note
   * @param {string} dateEdited edited date of the note
   * @param {Content} content
   *
   * @returns {Promise<Session>}
   */
  async add(noteId, dateEdited, content) {
    if (!noteId || !dateEdited || !content) return;
    let sessionId = `${noteId}_${dateEdited}`;
    let oldSession = await this._collection.getItem(sessionId);

    let session = {
      type: "session",
      id: sessionId,
      sessionContentId: makeSessionContentId(sessionId),
      noteId,
      title: content.title,
      dateCreated: oldSession ? oldSession.dateCreated : Date.now(),
      localOnly: true
    };

    const note = this._db.notes.note(noteId);
    if (note && note.data.locked) {
      session.locked = true;
    }

    await this._collection.addItem(session);
    await this.sessionContent.add(sessionId, content, session.locked);
    await this._cleanup(noteId);

    return session;
  }

  async _cleanup(noteId, limit = this.versionsLimit) {
    let history = await this.get(noteId);
    if (history.length === 0 || history.length < limit) return;
    history.sort(function (a, b) {
      return a.dateModified - b.dateModified;
    });
    let deleteCount = history.length - limit;

    for (let i = 0; i < deleteCount; i++) {
      let session = history[i];
      await this._remove(session);
    }
  }

  /**
   * Get content of a session
   * @param {string} sessionId session id
   *
   * @returns {Promise<Content>}
   */
  async content(sessionId) {
    if (!sessionId) return;
    /**
     * @type {Session}
     */
    let session = await this._collection.getItem(sessionId);
    return await this.sessionContent.get(session.sessionContentId);
  }

  /**
   * Remove a session from storage
   * @param {string} sessionId
   */
  async remove(sessionId) {
    if (!sessionId) return;
    /**
     * @type {Session}
     */
    let session = await this._collection.getItem(sessionId);
    await this._remove(session);
  }

  /**
   * Remove all sessions of a note from storage
   * @param {string} noteId
   */
  async clearSessions(noteId) {
    if (!noteId) return;
    let history = await this.get(noteId);
    for (let item of history) {
      await this._remove(item);
    }
  }

  /**
   *
   * @param {Session} session
   */
  async _remove(session) {
    await this._collection.deleteItem(session.id);
    await this.sessionContent.remove(session.sessionContentId);
  }

  /**
   *
   * @param {string} sessionId
   */
  async restore(sessionId) {
    /**
     * @type {Session}
     */
    const session = await this._collection.getItem(sessionId);
    const content = await this.sessionContent.get(session.sessionContentId);
    const note = this._db.notes.note(session.noteId);
    if (!note) return;

    if (session.locked) {
      await this._db.content.add({
        id: note.data.contentId,
        data: content.data,
        type: content.type
      });
    } else {
      await this._db.notes.add({
        id: session.noteId,
        content: {
          data: content.data,
          type: content.type
        }
      });
    }
  }

  /**
   *
   * @returns A json string containing all sessions with content
   */
  async serialize() {
    return JSON.stringify({
      sessions: await this.all(),
      sessionContents: await this.sessionContent.all()
    });
  }

  async all() {
    return this._getSessions(this._collection.indexer.getIndices());
  }

  async _getSessions(sessionIds) {
    let items = await this._collection.getItems(sessionIds);
    return Object.values(items);
  }

  /**
   * Restore session history from a serialized json string.
   * @param {string} data
   * @returns
   */
  async deserialize(data) {
    if (!data) return;
    let deserialized = JSON.parse(data);
    if (!deserialized.sessions || !deserialized.sessionContents) return;

    for (let session of deserialized.sessions) {
      let sessionContent = deserialized.sessionContents.find((v) =>
        v.id.includes(session.id)
      );

      if (sessionContent) {
        await this._collection.addItem(session);
        await this.sessionContent._collection.addItem(sessionContent);
      }
    }
  }
}
