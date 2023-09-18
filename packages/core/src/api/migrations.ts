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

import Database from ".";
import { CURRENT_DATABASE_VERSION } from "../common";
import Migrator, { MigratableCollections } from "../database/migrator";

class Migrations {
  private readonly migrator = new Migrator();
  private migrating = false;
  version = CURRENT_DATABASE_VERSION;
  constructor(private readonly db: Database) {}

  async init() {
    this.version =
      (await this.db.storage().read("v")) || CURRENT_DATABASE_VERSION;
    this.db.storage().write("v", this.version);
  }

  required() {
    return this.version < CURRENT_DATABASE_VERSION;
  }

  async migrate() {
    try {
      if (!this.required() || this.migrating) return;
      this.migrating = true;

      await this.db.notes.init();

      const collections: MigratableCollections = [
        {
          items: () => [this.db.legacySettings.raw],
          type: "settings"
        },
        {
          items: () => this.db.settings.raw,
          type: "settingsv2"
        },
        {
          items: () => this.db.attachments.all,
          type: "attachments"
        },
        {
          items: () => this.db.notebooks.raw,
          type: "notebooks"
        },
        {
          items: () => this.db.tags.raw,
          type: "tags"
        },
        {
          items: () => this.db.colors.raw,
          type: "colors"
        },
        {
          iterate: true,
          type: "content"
        },
        {
          items: () => this.db.shortcuts.raw,
          type: "shortcuts"
        },
        {
          items: () => this.db.reminders.raw,
          type: "reminders"
        },
        {
          items: () => this.db.relations.raw,
          type: "relations"
        },
        {
          iterate: true,
          type: "notehistory"
        },
        {
          iterate: true,
          type: "sessioncontent"
        },
        {
          items: () => this.db.notes.raw,
          type: "notes"
        }
      ];

      await this.migrator.migrate(this.db, collections, this.version);
      await this.db.storage().write("v", CURRENT_DATABASE_VERSION);
      this.version = CURRENT_DATABASE_VERSION;
    } finally {
      this.migrating = false;
    }
  }
}
export default Migrations;
