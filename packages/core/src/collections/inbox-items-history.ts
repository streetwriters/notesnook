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

import { InboxItemHistory } from "../types.js";
import Database from "../api/index.js";
import { ICollection } from "./collection.js";
import { SQLCollection } from "../database/sql-collection.js";
import { isFalse } from "../database/index.js";

export class InboxItemsHistory implements ICollection {
  name = "inboxitemshistory";
  readonly collection: SQLCollection<"inboxitemshistory", InboxItemHistory>;
  constructor(private readonly db: Database) {
    this.collection = new SQLCollection(
      db.sql,
      db.transaction,
      "inboxitemshistory",
      db.eventManager,
      db.sanitizer
    );
  }

  init() {
    return this.collection.init();
  }

  async add(item: {
    id: string;
    status: "failed" | "success";
    source?: string;
    errorContext?: string;
  }) {
    const now = Date.now();
    await this.collection.upsert({
      id: item.id,
      type: "inboxitemhistory",
      dateCreated: now,
      dateModified: now,
      dateSynced: now,
      status: item.status,
      source: item.source,
      errorContext: item.errorContext
    });
    return item.id;
  }

  get failed() {
    return this.collection.createFilter<InboxItemHistory>(
      (qb) => qb.where(isFalse("deleted")).where("status", "==", "failed"),
      this.db.options?.batchSize
    );
  }

  async delete(ids: string[]) {
    await this.collection.softDelete(ids);
  }

  async deleteFailed() {
    const ids = await this.failed.ids();
    await this.collection.softDelete(ids);
  }

  exists(id: string) {
    return this.collection.exists(id);
  }
}
