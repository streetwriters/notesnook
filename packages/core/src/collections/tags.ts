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

export class Tags implements ICollection {
  name = "tags";
  readonly collection: SQLCollection<"tags", Tag>;
  constructor(private readonly db: Database) {
    this.collection = new SQLCollection(db.sql, "tags", db.eventManager);
  }

  init() {
    return this.collection.init();
  }

  tag(id: string) {
    return this.collection.get(id);
  }

  // find(idOrTitle: string) {
  //   return this.all.find(
  //     (tag) => tag.title === idOrTitle || tag.id === idOrTitle
  //   );
  // }

  async add(item: Partial<Tag>) {
    if (item.remote)
      throw new Error("Please use db.tags.merge to merge remote tags.");

    const id = item.id || getId(item.dateCreated);
    const oldTag = await this.tag(id);

    item.title = item.title ? Tags.sanitize(item.title) : item.title;
    if (!item.title && !oldTag?.title) throw new Error("Title is required.");

    await this.collection.upsert({
      id,
      dateCreated: item.dateCreated || oldTag?.dateCreated || Date.now(),
      dateModified: item.dateModified || oldTag?.dateModified || Date.now(),
      title: item.title || oldTag?.title || "",
      type: "tag",
      remote: false
    });
    return id;
  }

  // get raw() {
  //   return this.collection.raw();
  // }

  get all() {
    return this.collection.createFilter<Tag>((qb) =>
      qb.where(isFalse("deleted"))
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
