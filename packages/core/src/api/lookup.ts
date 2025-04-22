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

import { match, surround } from "fuzzyjs";
import Database from "./index.js";
import {
  Item,
  Note,
  Notebook,
  Reminder,
  SortOptions,
  TrashItem
} from "../types.js";
import { DatabaseSchema, RawDatabaseSchema } from "../database/index.js";
import { AnyColumnWithTable, Kysely, sql } from "@streetwriters/kysely";
import { FilteredSelector } from "../database/sql-collection.js";
import { VirtualizedGrouping } from "../utils/virtualized-grouping.js";
import { logger } from "../logger.js";
import { rebuildSearchIndex } from "../database/fts.js";
import { transformQuery } from "../utils/query-transformer.js";
import { getSortSelectors } from "../utils/grouping.js";
import { fuzzy } from "../utils/fuzzy.js";

type SearchResults<T> = {
  sorted: (limit?: number) => Promise<VirtualizedGrouping<T>>;
  items: (limit?: number) => Promise<T[]>;
  ids: () => Promise<string[]>;
};

type FuzzySearchField<T> = {
  weight?: number;
  name: keyof T;
  column: AnyColumnWithTable<DatabaseSchema, keyof DatabaseSchema>;
  ignore?: boolean;
};
export default class Lookup {
  constructor(private readonly db: Database) {}

  notes(
    query: string,
    notes?: FilteredSelector<Note>,
    opts?: { titleOnly?: boolean }
  ): SearchResults<Note> {
    return this.toSearchResults(async (limit, sortOptions) => {
      const db = this.db.sql() as unknown as Kysely<RawDatabaseSchema>;
      const excludedIds = this.db.trash.cache.notes;

      query = transformQuery(query);
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
            .where("title", "match", query)
            .select(["id", sql<number>`rank * 10`.as("rank")])
            .$if(!opts?.titleOnly, (eb) =>
              eb.unionAll((eb) =>
                eb
                  .selectFrom("content_fts")
                  .$if(!!notes, (eb) =>
                    eb.where("noteId", "in", notes!.filter.select("id"))
                  )
                  .$if(excludedIds.length > 0, (eb) =>
                    eb.where("id", "not in", excludedIds)
                  )
                  .where("data", "match", query)
                  .select(["noteId as id", "rank"])
                  .$castTo<{
                    id: string;
                    rank: number;
                  }>()
              )
            )
            .as("results")
        )
        .select(["results.id"])
        .groupBy("results.id")
        .orderBy(sql`SUM(results.rank)`, sortOptions?.sortDirection || "desc")
        .$if(!!limit, (eb) => eb.limit(limit!))

        // filter out ids that have no note against them
        .where(
          "results.id",
          "in",
          (notes || this.db.notes.all).filter.select("id")
        )
        .execute()
        .catch((e) => {
          logger.error(e, `Error while searching`, { query });
          return [];
        });
      return results.map((r) => r.id);
    }, notes || this.db.notes.all);
  }

  notebooks(query: string) {
    const fields: FuzzySearchField<Notebook>[] = [
      { name: "id", column: "notebooks.id", weight: -100, ignore: true },
      { name: "title", column: "notebooks.title", weight: 10 },
      {
        name: "description",
        column: "notebooks.description"
      }
    ];
    return this.search(this.db.notebooks.all, query, fields);
  }

  tags(query: string) {
    return this.search(this.db.tags.all, query, [
      { name: "id", column: "tags.id", weight: -100, ignore: true },
      { name: "title", column: "tags.title" }
    ]);
  }

  reminders(query: string) {
    const fields: FuzzySearchField<Reminder>[] = [
      { name: "id", column: "reminders.id", weight: -100, ignore: true },
      { name: "title", column: "reminders.title", weight: 10 },
      {
        name: "description",
        column: "reminders.description"
      }
    ];
    return this.search(this.db.reminders.all, query, fields);
  }

  trash(query: string): SearchResults<TrashItem> {
    const sortOptions: SortOptions = {
      sortBy: "dateDeleted",
      sortDirection: "desc"
    };
    return {
      sorted: async (limit?: number) => {
        const { ids, items } = await this.filterTrash(
          query,
          limit,
          sortOptions
        );
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
        const { items } = await this.filterTrash(query, limit, sortOptions);
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
    return this.toSearchResults(async (limit, sortOptions) => {
      const results = await this.filter(selector, query, fields, {
        limit,
        sortOptions
      });
      return results.map((item) => item.id);
    }, selector);
  }

  private async filter<T extends Item>(
    selector: FilteredSelector<T>,
    query: string,
    fields: readonly FuzzySearchField<T>[],
    options: {
      limit?: number;
      sortOptions?: SortOptions;
      prefix?: string;
      suffix?: string;
    } = {}
  ) {
    const columns = fields.map((f) => f.column);
    const items = await selector.fields(columns).items();
    selector.fields([]);
    return fuzzy(
      query,
      items,
      (item) => item.id,
      Object.fromEntries(
        fields.filter((f) => !f.ignore).map((f) => [f.name, f.weight || 1])
      ) as Record<keyof T, number>,
      options
    );
  }

  private toSearchResults<T extends Item>(
    ids: (limit?: number, sortOptions?: SortOptions) => Promise<string[]>,
    selector: FilteredSelector<T>
  ): SearchResults<T> {
    const sortOptions: SortOptions = {
      sortBy: "dateCreated",
      sortDirection: "desc"
    };
    return {
      sorted: async (limit?: number) =>
        this.toVirtualizedGrouping(
          await ids(limit, sortOptions),
          selector,
          sortOptions
        ),
      items: async (limit?: number) =>
        this.toItems(await ids(limit, sortOptions), selector, sortOptions),
      ids
    };
  }

  private async filterTrash(
    query: string,
    limit?: number,
    sortOptions?: SortOptions
  ) {
    const items = await this.db.trash.all();

    const results: Map<string, { rank: number; item: TrashItem }> = new Map();
    for (const item of items) {
      if (limit && results.size >= limit) break;

      const result = match(query, item.title);
      if (result.match) {
        results.set(item.id, { rank: result.score, item });
      }
    }
    const sorted = Array.from(results.entries());

    if (!sortOptions)
      // || sortOptions.sortBy === "relevance")
      sorted.sort(
        // sortOptions?.sortDirection === "desc"
        //   ? (a, b) => a[1].rank - b[1].rank
        // :
        (a, b) => b[1].rank - a[1].rank
      );
    else {
      const selector = getSortSelectors(sortOptions)[sortOptions.sortDirection];
      sorted.sort((a, b) => selector(a[1].item, b[1].item));
    }
    return {
      ids: sorted.map((a) => a[0]),
      items: sorted.map((a) => a[1].item)
    };
  }

  private toVirtualizedGrouping<T extends Item>(
    ids: string[],
    selector: FilteredSelector<T>,
    sortOptions?: SortOptions
  ) {
    // if (sortOptions?.sortBy === "relevance") sortOptions = undefined;
    return new VirtualizedGrouping<T>(
      ids.length,
      this.db.options.batchSize,
      () => Promise.resolve(ids),
      async (start, end) => {
        const items = await selector.items(ids.slice(start, end), sortOptions);
        return {
          ids: items.map((i) => i.id),
          items
        };
      }
      // (items) => groupArray(items, () => `${items.length} results`)
    );
  }

  private toItems<T extends Item>(
    ids: string[],
    selector: FilteredSelector<T>,
    sortOptions?: SortOptions
  ) {
    if (!ids.length) return [];
    // if (sortOptions?.sortBy === "relevance") sortOptions = undefined;
    return selector.items(ids, sortOptions);
  }

  async rebuild() {
    const db = this.db.sql() as unknown as Kysely<RawDatabaseSchema>;
    await rebuildSearchIndex(db);
  }
}
