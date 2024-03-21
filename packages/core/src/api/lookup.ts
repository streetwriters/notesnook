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
import { Item, Note, TrashItem } from "../types";
import { DatabaseSchema, RawDatabaseSchema } from "../database";
import { AnyColumnWithTable, Kysely, sql } from "kysely";
import { FilteredSelector } from "../database/sql-collection";
import { VirtualizedGrouping } from "../utils/virtualized-grouping";

type SearchResults<T> = {
  sorted: (limit?: number) => Promise<VirtualizedGrouping<T>>;
  items: (limit?: number) => Promise<T[]>;
  ids: () => Promise<string[]>;
};

type FuzzySearchField<T> = {
  weight?: number;
  name: keyof T;
  column: AnyColumnWithTable<DatabaseSchema, keyof DatabaseSchema>;
};
export default class Lookup {
  constructor(private readonly db: Database) {}

  notes(query: string, notes?: FilteredSelector<Note>): SearchResults<Note> {
    return this.toSearchResults(async (limit) => {
      if (query.length <= 3) return [];

      const db = this.db.sql() as unknown as Kysely<RawDatabaseSchema>;
      query = query.replace(/"/, '""');

      const excludedIds = this.db.trash.cache.notes;
      const results = await db
        .selectFrom((eb) =>
          eb
            .selectFrom("notes_fts")
            .$if(!!notes, (eb) =>
              eb.where("id", "in", notes!.filter.select("id"))
            )
            .$if(excludedIds.length > 0, (eb) =>
              eb.where("id", "not in", excludedIds)
            )
            .where("title", "match", `"${query}"`)
            .select(["id", sql<number>`rank * 10`.as("rank")])
            .unionAll((eb) =>
              eb
                .selectFrom("content_fts")
                .$if(!!notes, (eb) =>
                  eb.where("id", "in", notes!.filter.select("id"))
                )
                .$if(excludedIds.length > 0, (eb) =>
                  eb.where("id", "not in", excludedIds)
                )
                .where("data", "match", `"${query}"`)
                .select(["noteId as id", "rank"])
                .$castTo<{ id: string; rank: number }>()
            )
            .as("results")
        )
        .select(["results.id"])
        .groupBy("results.id")
        .orderBy(sql`SUM(results.rank)`, "asc")
        .$if(!!limit, (eb) => eb.limit(limit!))
        .execute();
      return results.map((r) => r.id);
    }, notes || this.db.notes.all);
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

  trash(query: string): SearchResults<TrashItem> {
    return {
      sorted: async (limit?: number) => {
        const { ids, items } = await this.filterTrash(query, limit);
        return new VirtualizedGrouping<TrashItem>(
          ids.length,
          this.db.options.batchSize,
          () => Promise.resolve(ids),
          async (start, end) => {
            return {
              ids: ids.slice(start, end),
              items: items.slice(start, end)
            };
          }
        );
      },
      items: async (limit?: number) => {
        const { items } = await this.filterTrash(query, limit);
        return items;
      },
      ids: () => this.filterTrash(query).then(({ ids }) => ids)
    };
  }

  attachments(query: string) {
    return this.search(this.db.attachments.all, query, [
      { name: "id", column: "attachments.id", weight: -100 },
      { name: "filename", column: "attachments.filename", weight: 5 },
      { name: "mimeType", column: "attachments.mimeType" },
      { name: "hash", column: "attachments.hash" }
    ]);
  }

  private search<T extends Item>(
    selector: FilteredSelector<T>,
    query: string,
    fields: FuzzySearchField<T>[]
  ) {
    return this.toSearchResults(
      (limit) => this.filter(selector, query, fields, limit),
      selector
    );
  }

  private async filter<T extends Item>(
    selector: FilteredSelector<T>,
    query: string,
    fields: FuzzySearchField<T>[],
    limit?: number
  ) {
    const results: Map<string, number> = new Map();
    const columns = fields.map((f) => f.column);
    for await (const item of selector.fields(columns)) {
      if (limit && results.size >= limit) break;

      for (const field of fields) {
        const result = match(query, `${item[field.name]}`);
        if (result.match) {
          const oldScore = results.get(item.id) || 0;
          results.set(item.id, oldScore + result.score * (field.weight || 1));
        }
      }
    }
    selector.fields([]);

    return Array.from(results.entries())
      .sort((a, b) => a[1] - b[1])
      .map((a) => a[0]);
  }

  private toSearchResults<T extends Item>(
    ids: (limit?: number) => Promise<string[]>,
    selector: FilteredSelector<T>
  ): SearchResults<T> {
    return {
      sorted: async (limit?: number) =>
        this.toVirtualizedGrouping(await ids(limit), selector),
      items: async (limit?: number) => this.toItems(await ids(limit), selector),
      ids
    };
  }

  private async filterTrash(query: string, limit?: number) {
    const items = await this.db.trash.all();

    const results: Map<string, { rank: number; item: TrashItem }> = new Map();
    for (const item of items) {
      if (limit && results.size >= limit) break;

      const result = match(query, item.title);
      if (result.match) {
        results.set(item.id, { rank: result.score, item });
      }
    }

    const sorted = Array.from(results.entries()).sort(
      (a, b) => a[1].rank - b[1].rank
    );
    return {
      ids: sorted.map((a) => a[0]),
      items: sorted.map((a) => a[1].item)
    };
  }

  private toVirtualizedGrouping<T extends Item>(
    ids: string[],
    selector: FilteredSelector<T>
  ) {
    return new VirtualizedGrouping<T>(
      ids.length,
      this.db.options.batchSize,
      () => Promise.resolve(ids),
      async (start, end) => {
        const items = await selector.records(ids);
        return {
          ids: ids.slice(start, end),
          items: Object.values(items).slice(start, end)
        };
      }
    );
  }

  private toItems<T extends Item>(
    ids: string[],
    selector: FilteredSelector<T>
  ) {
    if (!ids.length) return [];
    return selector.items(ids);
  }
}
