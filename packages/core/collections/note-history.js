import { makeSessionContentId, makeSessionId } from "../utils/id";
import Collection from "./collection";
import SessionContent from "./session-content";
/**
 * @typedef Session
 * @property {string} id
 * @property {string} noteId
 * @property {string} sessionContentId
 * @property {string} dateEdited
 * @property {string} dateCreated
 * @property {boolean} locked
 */

/**
 * @typedef Content
 * @property {string} data
 * @property {string} type
 */

export default class NoteHistory extends Collection {
  constructor(db, name, cached) {
    super(db, name, cached);
    this.versionsLimit = 100;
  }

  async init() {
    super.init();

    /**
     * @type {SessionContent}
     */
    this.sessionContent = await SessionContent.new(
      this._db,
      "sessioncontent",
      false
    );
  }

  /**
   * Get complete session history of a note.
   * @param noteId id of the note
   * @returns {Promise<Session[]>} An array of session ids of a note
   */
  async get(noteId) {
    if (!noteId) return [];

    let indices = await this._collection.indexer.getIndices();
    let sessionIds = indices.filter((id) => id.includes(noteId));
    if (sessionIds.length === 0) return [];
    let history = (await this._collection.getItems(sessionIds)) || [];

    return history;
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
    let exists = await this._collection.exists(sessionId);
    let locked = this._db.notes.note(noteId)?.data?.locked;

    let session = {
      id: sessionId,
      sessionContentId: makeSessionContentId(sessionId),
      noteId,
    };
    if (!exists) {
      session.dateCreated = Date.now();
    }

    if (locked) {
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
      return a.dateEdited - b.dateEdited;
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
  content(sessionId) {
    if (!sessionId) return;
    return this.sessionContent.get(sessionId);
  }

  /**
   * Remove a session from storage
   * @param {string} sessionId
   */
  async removeSession(sessionId) {
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
    let session = await this._collection.getItem(sessionId);
    let content = await this.sessionContent.get(session.sessionContentId);
    let note = this._db.notes.note(session.noteId).data;
    if (session.locked) {
      await this._db.content.add({
        id: note.contentId,
        data: content.data,
        type: content.type,
      });
    } else {
      await this._db.notes.add({
        id: session.noteId,
        content: {
          data: content.data,
          type: content.type,
        },
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
      sessionContents: await this.sessionContent.all(),
    });
  }

  async all() {
    let indices = await this._collection.indexer.getIndices();
    let items = await this._collection.getItems(indices);
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
