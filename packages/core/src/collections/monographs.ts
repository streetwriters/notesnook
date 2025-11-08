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
import { Monograph } from "../types.js";
import { ICollection } from "./collection.js";
import { SQLCollection } from "../database/sql-collection.js";
import { getId } from "../utils/id.js";
import { isFalse } from "../database/index.js";

export class Monographs implements ICollection {
  name = "monographs";
  readonly collection: SQLCollection<"monographs", Monograph>;
  constructor(private readonly db: Database) {
    this.collection = new SQLCollection(
      db.sql,
      db.transaction,
      "monographs",
      db.eventManager,
      db.sanitizer
    );
  }

  async init() {
    await this.collection.init();
  }

  get all() {
    return this.collection.createFilter<Monograph>(
      (qb) => qb.where(isFalse("deleted")),
      this.db.options?.batchSize
    );
  }

  async add(monograph: Partial<Monograph>) {
    const id = monograph.id || getId();
    const oldMonograph = await this.collection.get(id);
    const merged: Partial<Monograph> = {
      ...oldMonograph,
      ...monograph
    };

    await this.collection.upsert({
      id,
      title: merged.title,
      datePublished: merged.datePublished,
      selfDestruct: merged.selfDestruct,
      password: merged.password,
      type: "monograph"
    });
  }
}
