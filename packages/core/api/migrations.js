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

import { CURRENT_DATABASE_VERSION } from "../common";
import Migrator from "../database/migrator";

class Migrations {
  /**
   *
   * @param {import("./index").default} db
   */
  constructor(db) {
    this._db = db;
    this._migrator = new Migrator();
    this._isMigrating = false;
  }

  async init() {
    this.dbVersion =
      (await this._db.storage.read("v")) || CURRENT_DATABASE_VERSION;
    this._db.storage.write("v", this.dbVersion);
  }

  required() {
    return this.dbVersion < CURRENT_DATABASE_VERSION;
  }

  async migrate() {
    try {
      if (!this.required() || this._isMigrating) return;
      this._isMigrating = true;

      await this._db.notes.init();

      const collections = [
        {
          index: () => this._db.attachments.all,
          dbCollection: this._db.attachments
        },
        {
          index: () => this._db.notebooks.raw,
          dbCollection: this._db.notebooks
        },
        {
          index: () => this._db.tags.raw,
          dbCollection: this._db.tags
        },
        {
          index: () => this._db.colors.raw,
          dbCollection: this._db.colors
        },
        {
          index: () => this._db.trash.raw,
          dbCollection: this._db.trash
        },
        {
          index: () => this._db.content.all(),
          dbCollection: this._db.content
        },
        {
          index: () => [this._db.settings.raw],
          dbCollection: this._db.settings,
          type: "settings"
        },
        {
          index: () => this._db.shortcuts.raw,
          dbCollection: this._db.shortcuts
        },
        {
          index: () => this._db.reminders.raw,
          dbCollection: this._db.reminders
        },
        {
          index: () => this._db.relations.raw,
          dbCollection: this._db.relations
        },
        {
          index: () => this._db.noteHistory.sessionContent.all(),
          dbCollection: this._db.noteHistory
        },
        {
          index: () => this._db.noteHistory.sessionContent.all(),
          dbCollection: this._db.noteHistory.sessionContent
        },
        {
          index: () => this._db.notes.raw,
          dbCollection: this._db.notes
        }
      ];

      await this._migrator.migrate(
        this._db,
        collections,
        (item) => item,
        this.dbVersion
      );
      await this._db.storage.write("v", CURRENT_DATABASE_VERSION);
      this.dbVersion = CURRENT_DATABASE_VERSION;
    } finally {
      this._isMigrating = false;
    }
  }
}
export default Migrations;
