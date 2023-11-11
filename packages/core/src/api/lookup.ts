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

import { match } from "fuzzyjs";
import Database from ".";
import { Item, TrashItem } from "../types";
import { DatabaseSchema, DatabaseSchemaWithFTS, isFalse } from "../database";
import { AnyColumnWithTable, Kysely, sql } from "kysely";
import { FilteredSelector } from "../database/sql-collection";
import { VirtualizedGrouping } from "../utils/virtualized-grouping";

type FuzzySearchField<T> = {
  weight?: number;
  name: keyof T;
  column: AnyColumnWithTable<DatabaseSchema, keyof DatabaseSchema>;
};
export default class Lookup {
  constructor(private readonly db: Database) {}

  async notes(query: string, noteIds?: string[]) {
    const db = this.db.sql() as Kysely<DatabaseSchemaWithFTS>;
    const ids = await db
      .with("matching", (eb) =>
        eb
          .selectFrom("content_fts")
          .where("data", "match", query)
          .select(["noteId as id", "rank"])
          .unionAll(
            eb
              .selectFrom("notes_fts")
              .where("title", "match", query)
              // add 10 weight to title
              .select(["id", sql.raw<number>(`rank * 10`).as("rank")])
          )
      )
      .selectFrom("notes")
      .$if(!!noteIds && noteIds.length > 0, (eb) =>
        eb.where("id", "in", noteIds!)
      )
      .where(isFalse("notes.deleted"))
      .where(isFalse("notes.dateDeleted"))
      .innerJoin("matching", (eb) => eb.onRef("notes.id", "==", "matching.id"))
      .orderBy("matching.rank")
      .select(["notes.id"])
      .execute();

    return new VirtualizedGrouping(
      ids.map((id) => id.id),
      this.db.options.batchSize,
      (ids) => this.db.notes.all.records(ids)
    );
  }

  notebooks(query: string) {
    return this.search(this.db.notebooks.all, query, [
      { name: "id", column: "notebooks.id", weight: -100 },
      { name: "title", column: "notebooks.title", weight: 10 },
      { name: "description", column: "notebooks.description" }
    ]);
  }

  tags(query: string) {
    return this.search(this.db.tags.all, query, [
      { name: "id", column: "tags.id", weight: -100 },
      { name: "title", column: "tags.title" }
    ]);
  }

  reminders(query: string) {
    return this.search(this.db.reminders.all, query, [
      { name: "id", column: "reminders.id", weight: -100 },
      { name: "title", column: "reminders.title", weight: 10 },
      { name: "description", column: "reminders.description" }
    ]);
  }

  async trash(query: string) {
    const items = await this.db.trash.all();
    const records: Record<string, TrashItem> = {};
    for (const item of items) records[item.id] = item;

    const results: Record<string, number> = {};
    for (const item of items) {
      const result = match(query, item.title);
      if (result.match) results[item.id] = result.score;
    }

    const ids = Object.keys(results).sort((a, b) => results[a] - results[b]);
    return new VirtualizedGrouping<TrashItem>(
      ids,
      this.db.options.batchSize,
      async (ids) => {
        const items: Record<string, TrashItem> = {};
        for (const id of ids) items[id] = records[id];
        return items;
      }
    );
  }

  attachments(query: string) {
    return this.search(this.db.attachments.all, query, [
      { name: "id", column: "attachments.id", weight: -100 },
      { name: "filename", column: "attachments.filename", weight: 5 },
      { name: "mimeType", column: "attachments.mimeType" },
      { name: "hash", column: "attachments.hash" }
    ]);
  }

  private async search<T extends Item>(
    selector: FilteredSelector<T>,
    query: string,
    fields: FuzzySearchField<T>[]
  ) {
    const results: Record<string, number> = {};
    const columns = fields.map((f) => f.column);
    for await (const item of selector.fields(columns)) {
      for (const field of fields) {
        const result = match(query, `${item[field.name]}`);
        if (result.match) {
          const oldScore = results[item.id] || 0;
          results[item.id] = oldScore + result.score * (field.weight || 1);
        }
      }
    }
    selector.fields([]);

    const ids = Object.keys(results).sort((a, b) => results[a] - results[b]);
    return new VirtualizedGrouping<T>(
      ids,
      this.db.options.batchSize,
      async (ids) => selector.records(ids)
    );
  }
}
