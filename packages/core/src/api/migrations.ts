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

import Database from "./index.js";
import { CURRENT_DATABASE_VERSION } from "../common.js";
import Migrator, { MigratableCollections } from "../database/migrator.js";

const collections: MigratableCollections = [
  {
    name: "settings",
    table: "settings"
  },
  {
    name: "settingsv2",
    table: "settings"
  },
  {
    name: "attachments",
    table: "attachments"
  },
  {
    name: "notebooks",
    table: "notebooks"
  },
  {
    name: "tags",
    table: "tags"
  },
  {
    name: "colors",
    table: "colors"
  },
  {
    name: "content",
    table: "content"
  },
  {
    name: "shortcuts",
    table: "shortcuts"
  },
  {
    name: "reminders",
    table: "reminders"
  },
  {
    name: "relations",
    table: "relations"
  },
  {
    name: "notehistory",
    table: "notehistory"
  },
  {
    name: "sessioncontent",
    table: "sessioncontent"
  },
  {
    name: "notes",
    table: "notes"
  },
  {
    name: "vaults",
    table: "vaults"
  }
];

class Migrations {
  private readonly migrator = new Migrator();
  private migrating = false;
  version = CURRENT_DATABASE_VERSION;
  constructor(private readonly db: Database) {}

  async init() {
    this.version =
      (await this.db.kv().read("v")) ||
      (await this.db.storage().read("v")) ||
      CURRENT_DATABASE_VERSION;

    await this.db.kv().write("v", this.version);
  }

  required() {
    return this.version < CURRENT_DATABASE_VERSION;
  }

  async migrate() {
    try {
      if (!this.required() || this.migrating) return;
      this.migrating = true;

      await this.migrator.migrate(this.db, collections, this.version);
      await this.db.kv().write("v", CURRENT_DATABASE_VERSION);
      this.version = CURRENT_DATABASE_VERSION;
    } finally {
      this.migrating = false;
    }
  }
}
export default Migrations;
