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

import { getId } from "../utils/id";
import { Tag } from "../types";
import Database from "../api";
import { ICollection } from "./collection";
import { SQLCollection } from "../database/sql-collection";
import { isFalse } from "../database";
import { sql } from "kysely";

export class Tags implements ICollection {
  name = "tags";
  readonly collection: SQLCollection<"tags", Tag>;
  constructor(private readonly db: Database) {
    this.collection = new SQLCollection(
      db.sql,
      db.transaction,
      "tags",
      db.eventManager,
      db.sanitizer
    );
  }

  init() {
    return this.collection.init();
  }

  tag(id: string) {
    return this.collection.get(id);
  }

  find(title: string) {
    return this.all.find(sql`title == ${title} COLLATE BINARY`);
  }

  async add(item: Partial<Tag> & { title: string }) {
    item.title = Tags.sanitize(item.title);

    const id = item.id || getId();
    const oldTag = item.id ? await this.tag(item.id) : undefined;

    if (oldTag && item.title === oldTag.title) return oldTag.id;

    if (await this.find(item.title))
      throw new Error("Tag with this title already exists.");

    if (oldTag) {
      await this.collection.update([oldTag.id], item);
    } else {
      await this.collection.upsert({
        id,
        dateCreated: item.dateCreated || Date.now(),
        dateModified: item.dateModified || Date.now(),
        title: item.title,
        type: "tag"
      });
    }
    return id;
  }

  // get raw() {
  //   return this.collection.raw();
  // }

  get all() {
    return this.collection.createFilter<Tag>(
      (qb) => qb.where(isFalse("deleted")),
      this.db.options?.batchSize
    );
  }

  async remove(...ids: string[]) {
    await this.db.transaction(async () => {
      await this.db.relations.unlinkOfType("tag", ids);
      await this.collection.softDelete(ids);
    });
  }

  exists(id: string) {
    return this.collection.exists(id);
  }

  static sanitize(title: string) {
    return title.replace(/^\s+|\s+$/gm, "");
  }
}
