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

import Topics from "../collections/topics";

export default class Notebook {
  /**
   *
   * @param {Object} notebook
   * @param {import ('../api').default} db
   */
  constructor(notebook, db) {
    this._notebook = notebook;
    this._db = db;
  }

  get totalNotes() {
    return this._notebook.topics.reduce((sum, topic) => {
      return sum + this._db.notes.topicReferences.count(topic.id);
    }, 0);
  }

  get title() {
    return this._notebook.title;
  }

  get data() {
    return this._notebook;
  }

  get topics() {
    return new Topics(this._notebook.id, this._db);
  }

  get dateEdited() {
    return this._notebook.dateEdited;
  }

  get dateModified() {
    return this._notebook.dateModified;
  }

  _toggle(prop) {
    return this._db.notebooks.add({
      id: this._notebook.id,
      [prop]: !this._notebook[prop]
    });
  }

  pin() {
    return this._toggle("pinned");
  }
}
