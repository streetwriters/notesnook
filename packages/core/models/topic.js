/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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

export default class Topic {
  /**
   * @param {Object} topic
   * @param {string} notebookId
   * @param {import('../api').default} db
   */
  constructor(topic, notebookId, db) {
    this._topic = topic;
    this._db = db;
    this._notebookId = notebookId;
  }

  get totalNotes() {
    return this._db.notes.topicReferences.count(this.id);
  }

  get id() {
    return this._topic.id;
  }

  has(noteId) {
    return this._db.notes.topicReferences.has(this.id, noteId);
  }

  get all() {
    const noteIds = this._db.notes.topicReferences.get(this.id);
    if (!noteIds.length) return [];

    return noteIds.reduce((arr, noteId) => {
      let note = this._db.notes.note(noteId);
      if (note) arr.push(note.data);
      return arr;
    }, []);
  }

  clear() {
    const noteIds = this._db.notes.topicReferences.get(this.id);
    if (!noteIds.length) return;

    return this._db.notes.removeFromNotebook(
      {
        topic: this.id,
        id: this._notebookId,
        rebuildCache: true
      },
      ...noteIds
    );
  }
}
