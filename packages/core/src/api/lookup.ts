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
import Database from "./index.js";
import {
  HighlightedResult,
  Item,
  Match,
  Note,
  Notebook,
  Reminder,
  SortOptions,
  TrashItem
} from "../types.js";
import { DatabaseSchema, RawDatabaseSchema } from "../database/index.js";
import {
  AnyColumnWithTable,
  ExpressionBuilder,
  Kysely,
  SelectQueryBuilder,
  sql
} from "@streetwriters/kysely";
import { FilteredSelector } from "../database/sql-collection.js";
import { VirtualizedGrouping } from "../utils/virtualized-grouping.js";
import { logger } from "../logger.js";
import { rebuildSearchIndex } from "../database/fts.js";
import { QueryTokens, transformQuery } from "../utils/query-transformer.js";
import { getSortSelectors, groupArray } from "../utils/grouping.js";
import { fuzzy } from "../utils/fuzzy.js";
import { extractMatchingBlocks } from "../utils/html-parser.js";
import { Parser } from "htmlparser2";
import { strings } from "@notesnook/intl";

type SearchResults<T> = {
  sorted: (sortOptions?: SortOptions) => Promise<VirtualizedGrouping<T>>;
  items: (limit?: number, sortOptions?: SortOptions) => Promise<T[]>;
  ids: (limit?: number, sortOptions?: SortOptions) => Promise<string[]>;
};

type FuzzySearchField<T> = {
  weight?: number;
  name: keyof T;
  column: AnyColumnWithTable<DatabaseSchema, keyof DatabaseSchema>;
  ignore?: boolean;
};

const MATCH_TAG_NAME = "nn-search-result";
const MATCH_TAG_OPEN = `<${MATCH_TAG_NAME}>`;
const MATCH_TAG_CLOSE = `</${MATCH_TAG_NAME}>`;
const MATCH_TAG_REGEX = new RegExp(
  `<${MATCH_TAG_NAME}>(.*?)<\\/${MATCH_TAG_NAME}>`,
  "gm"
);
export default class Lookup {
  constructor(private readonly db: Database) {}

  notes(query: string, notes?: FilteredSelector<Note>): SearchResults<Note> {
    return this.toSearchResults(async (limit, sortOptions) => {
      const excludedIds = this.db.trash.cache.notes;

      const { content, title } = transformQuery(query);

      const ftsResults: string[] =
        (await this.ftsQueryBuilder(
          { content: content?.query, title: title?.query },
          excludedIds,
          notes
        )
          ?.select(["results.id"])
          .groupBy("results.id")
          .orderBy(sql`SUM(results.rank)`, sortOptions?.sortDirection || "desc")
          .execute()
          .catch((e) => {
            logger.error(e, `Error while searching`, { query });
            return [];
          })
          .then((r) => r.map((r) => r.id))) || [];

      const regexMatches = await this.regexQueryBuilder(
        {
          content: filterSmallTokens(content?.tokens),
          title: filterSmallTokens(title?.tokens)
        },
        (!!content || !!title) && ftsResults.length > 0 ? ftsResults : notes
      )
        ?.select("results.id")
        .execute();
      if (!regexMatches) return ftsResults;

      return regexMatches.map((r) => r.id);
    }, notes || this.db.notes.all);
  }

  async notesWithHighlighting(
    query: string,
    notes: FilteredSelector<Note>,
    sortOptions?: SortOptions
  ): Promise<VirtualizedGrouping<HighlightedResult>> {
    const db = this.db.sql() as unknown as Kysely<RawDatabaseSchema>;
    const excludedIds = this.db.trash.cache.notes;

    const {
      content,
      title,
      tag,
      color,
      archived,
      favorite,
      locked,
      pinned,
      readonly,
      created_before,
      created_after,
      edited_after,
      edited_before,
      filters
    } = transformQuery(query);

    const tagIds = tag?.length
      ? await this.db.tags.all.where((eb) => eb("tags.title", "in", tag)).ids()
      : [];
    const colorIds = color?.length
      ? await this.db.colors.all
          .where((eb) => eb("colors.title", "in", color))
          .ids()
      : [];

    if (filters > 0) {
      const defaultVault = await this.db.vaults.default();
      notes = notes.where((eb) => {
        const exprs = [];
        if (tagIds.length > 0)
          exprs.push(
            eb(
              "notes.id",
              "in",
              this.db.relations
                .from({ ids: tagIds, type: "tag" }, "note")
                .selector.filter.select("id")
            )
          );
        if (colorIds.length > 0)
          exprs.push(
            eb(
              "notes.id",
              "in",
              this.db.relations
                .from({ ids: colorIds, type: "color" }, "note")
                .selector.filter.select("id")
            )
          );
        if (typeof locked === "boolean" && defaultVault) {
          const filter = this.db.relations
            .from(defaultVault, "note")
            .selector.filter.select("id");
          exprs.push(eb("notes.id", locked ? "in" : "not in", filter));
        }
        if (typeof archived === "boolean")
          exprs.push(eb("notes.archived", "==", archived));
        if (typeof favorite === "boolean")
          exprs.push(eb("notes.favorite", "==", favorite));
        if (typeof pinned === "boolean")
          exprs.push(eb("notes.pinned", "==", pinned));
        if (typeof readonly === "boolean")
          exprs.push(eb("notes.readonly", "==", readonly));
        if (typeof created_after === "number")
          exprs.push(eb("notes.dateCreated", ">", created_after));
        if (typeof created_before === "number")
          exprs.push(eb("notes.dateCreated", "<", created_before));
        if (typeof edited_after === "number")
          exprs.push(eb("notes.dateEdited", ">", edited_after));
        if (typeof edited_before === "number")
          exprs.push(eb("notes.dateEdited", "<", edited_before));
        return eb.and(exprs);
      });
    }

    console.time("gather matches");
    const ftsResults =
      (await this.ftsQueryBuilder(
        { content: content?.query, title: title?.query },
        excludedIds,
        notes
      )
        ?.select(["id", "type", "rank"])
        .execute()
        .catch((e) => {
          logger.error(e, `Error while searching`, { query });
          return [];
        })) || [];

    const ftsIds = ftsResults.map((r) => r.id);
    const regexMatches =
      (await this.regexQueryBuilder(
        {
          content: filterSmallTokens(content?.tokens),
          title: filterSmallTokens(title?.tokens)
        },
        (!!content || !!title) && ftsIds.length > 0 ? ftsIds : notes
      )
        ?.select(["results.id", "results.type", sql<number>`1`.as("rank")])
        .execute()) || [];
    console.timeEnd("gather matches");

    console.time("sorting matches");
    type Matches = {
      ids: string[];
      values: { id: string; types: string[]; rank: number }[];
    };
    let matches: Matches = { ids: [], values: [] };
    for (const array of [ftsResults, regexMatches])
      for (const { id, type, rank } of array) {
        const index = matches.ids.indexOf(id);
        const match =
          index === -1
            ? {
                id,
                types: [],
                rank: 0
              }
            : matches.values[index];
        match.types.push(type);
        match.rank += rank || 0;

        if (index === -1) {
          matches.ids.push(id);
          matches.values.push(match);
        }
      }

    if (!sortOptions || sortOptions.sortBy === "relevance") {
      matches.values.sort(
        sortOptions?.sortDirection === "desc"
          ? (a, b) => a.rank - b.rank
          : (a, b) => b.rank - a.rank
      );
      matches.ids = matches.values.map((c) => c.id);
    } else {
      const sortedNoteIds = await this.db.notes.all
        .fields(["notes.id"])
        .items(matches.ids, sortOptions);
      const sorted: Matches = { ids: [], values: [] };
      for (const { id } of sortedNoteIds) {
        const index = matches.ids.indexOf(id);
        if (index === -1) continue;
        sorted.values.push(matches.values[index]);
        sorted.ids.push(id);
      }
      matches = sorted;
    }
    console.timeEnd("sorting matches");

    const isQueryless = !matches.ids.length && filters > 0;
    if (isQueryless) {
      const ids = await notes.items(undefined, sortOptions);
      for (const { id } of ids) {
        matches.values.push({
          id,
          rank: 1,
          types: ["title"]
        });
        matches.ids.push(id);
      }
    }

    const titleTokens = transformTokens(title?.tokens);
    const contentTokens = transformTokens(content?.tokens);

    return new VirtualizedGrouping<HighlightedResult>(
      matches.ids.length,
      20,
      async () => matches.ids,
      async (start, end) => {
        const chunk = matches.values.slice(start, end);
        const titleMatches = chunk
          .filter((c) => c.types.includes("title"))
          .map((c) => c.id);
        const contentMatches = chunk
          .filter((c) => c.types.includes("content"))
          .map((c) => c.id);
        const results: HighlightedResult[] = chunk.map((c) => ({
          id: c.id,
          title: [],
          type: "searchResult",
          content: [],
          rank: 0,
          dateCreated: 0,
          dateModified: 0
        }));

        const titles =
          titleMatches.length > 0 && !isQueryless
            ? await db
                .selectFrom("notes")
                .where("id", "in", titleMatches)
                .select(["id", "title"])
                .execute()
            : [];

        for (const title of titles) {
          const { text: highlighted } = highlightQueries(
            title.title || "",
            titleTokens.allTokens
          );
          const hasMatches = textContainsTokens(highlighted, titleTokens);
          const result = results.find((c) => c.id === title.id);
          if (!result) continue;
          result.title = hasMatches
            ? splitHighlightedMatch(highlighted).flatMap((m) => m)
            : [];
        }

        const htmls =
          contentMatches.length > 0 && !isQueryless
            ? await db
                .selectFrom("content")
                .where("noteId", "in", contentMatches)
                .select(["data", "noteId as id"])
                .$castTo<{ data: string; id: string }>()
                .execute()
            : [];

        for (const html of htmls) {
          const result = results.find((r) => r.id === html.id);
          if (!result) continue;

          const highlighted = highlightHtmlContent(
            html.data,
            contentTokens.allTokens
          );
          if (!textContainsTokens(highlighted, contentTokens)) continue;
          result.content = extractMatchingBlocks(
            highlighted,
            MATCH_TAG_NAME
          ).flatMap((block) => {
            return splitHighlightedMatch(block);
          });
          if (result.content.length === 0) continue;
          result.rawContent = highlighted;
        }

        const resultsWithMissingTitle = results
          .filter(
            isQueryless
              ? (r) => !r.title.length
              : (r) => !r.title.length && r.content.length > 0
          )
          .map((r) => r.id);

        if (resultsWithMissingTitle.length > 0) {
          const titles = await db
            .selectFrom("notes")
            .where("id", "in", resultsWithMissingTitle)
            .select(["id", "title"])
            .execute();
          for (const title of titles) {
            const result = results.find((r) => r.id === title.id);
            if (!result || !title.title) continue;
            result.title = stringToMatch(title.title);
          }
        }

        for (const result of results) {
          result.content.sort(
            (a, b) =>
              getMatchScore(b, contentTokens.allTokens) -
              getMatchScore(a, contentTokens.allTokens)
          );
        }

        return {
          ids: results.map((c) => c.id),
          items: results
        };
      },
      () =>
        new Map([
          [
            0,
            {
              index: 0,
              group: {
                id: "0",
                title: "",
                type: "header"
              }
            }
          ]
        ])
    );
  }

  private ftsQueryBuilder(
    queries: {
      title?: string;
      content?: string;
    },
    excludedIds: string[] = [],
    filter?: FilteredSelector<Note>
  ) {
    if (!queries.content && !queries.title) return;

    const db = this.db.sql() as unknown as Kysely<RawDatabaseSchema>;

    function buildTitleQuery(
      eb:
        | Kysely<RawDatabaseSchema>
        | ExpressionBuilder<RawDatabaseSchema, never>
    ) {
      return eb
        .selectFrom("notes_fts")
        .$if(!!filter, (eb) =>
          eb.where("id", "in", filter!.filter.select("id"))
        )
        .$if(excludedIds.length > 0, (eb) =>
          eb.where("id", "not in", excludedIds)
        )
        .where("title", "match", queries.title)
        .where("rank", "=", sql<number>`'bm25(1.0, 10.0)'`)
        .select(["id", "rank", sql<string>`'title'`.as("type")]);
    }

    function buildContentQuery(
      eb:
        | Kysely<RawDatabaseSchema>
        | ExpressionBuilder<RawDatabaseSchema, never>
    ) {
      return eb
        .selectFrom("content_fts")
        .$if(!!filter, (eb) =>
          eb.where("noteId", "in", filter!.filter.select("id"))
        )
        .$if(excludedIds.length > 0, (eb) =>
          eb.where("noteId", "not in", excludedIds)
        )
        .where("data", "match", queries.content)
        .where("rank", "=", sql<number>`'bm25(1.0, 1.0, 10.0)'`)
        .select(["noteId as id", "rank", sql<string>`'content'`.as("type")])
        .$castTo<{
          id: string;
          rank: number;
          type: "content" | "title";
        }>();
    }

    if (queries.content && queries.title)
      return db.selectFrom((eb) =>
        buildTitleQuery(eb)
          .unionAll((eb) => buildContentQuery(eb))
          .as("results")
      );
    else if (queries.content)
      return db.selectFrom((eb) => buildContentQuery(eb).as("results"));
    else if (queries.title)
      return db.selectFrom((eb) => buildTitleQuery(eb).as("results"));
  }

  private regexQueryBuilder(
    queries: {
      title?: string[];
      content?: string[];
    },
    ids?: string[] | FilteredSelector<Note>
  ) {
    if (!queries.content?.length && !queries.title?.length) return;

    const buildRegex = (queries: string[]) =>
      queries
        .filter((q) => q && q.length > 0)
        .map((q) => q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("|");

    function buildTitleQuery(
      eb: Kysely<DatabaseSchema> | ExpressionBuilder<DatabaseSchema, never>,
      queries: string[]
    ) {
      const regex = buildRegex(queries);
      return eb
        .selectFrom("notes")
        .$if(!!ids, (eb) =>
          eb.where(
            "id",
            "in",
            Array.isArray(ids) ? ids! : ids!.filter.select("id")
          )
        )
        .where("title", "regexp", sql<string>`${regex}`)
        .select(["id", sql<string>`'title'`.as("type")]);
    }

    function buildContentQuery(
      eb: Kysely<DatabaseSchema> | ExpressionBuilder<DatabaseSchema, never>,
      queries: string[]
    ) {
      const regex = buildRegex(queries);
      return eb
        .selectFrom("content")
        .where("content.locked", "!=", true)
        .$if(!!ids, (eb) =>
          eb.where(
            "noteId",
            "in",
            Array.isArray(ids) ? ids! : ids!.filter.select("id")
          )
        )
        .where("data", "regexp", sql<string>`${regex}`)
        .select(["noteId as id", sql<string>`'content'`.as("type")])
        .$castTo<{
          id: string;
          type: "content" | "title";
        }>();
    }

    if (queries.content && queries.title)
      return this.db.sql().selectFrom((eb) =>
        buildTitleQuery(eb, queries.title!)
          .unionAll((eb) => buildContentQuery(eb, queries.content!))
          .as("results")
      );
    else if (queries.content)
      return this.db
        .sql()
        .selectFrom((eb) =>
          buildContentQuery(eb, queries.content!).as("results")
        );
    else if (queries.title)
      return this.db
        .sql()
        .selectFrom((eb) => buildTitleQuery(eb, queries.title!).as("results"));
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
    return {
      sorted: async (sortOptions?: SortOptions) => {
        const { ids, items } = await this.filterTrash(
          query,
          undefined,
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
      items: async (limit, sortOptions?: SortOptions) => {
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
        sortOptions,
        limit
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
    return {
      sorted: async (sortOptions) =>
        this.toVirtualizedGrouping(
          await ids(undefined, sortOptions),
          selector,
          sortOptions
        ),
      items: async (limit, sortOptions) =>
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
      if (limit !== undefined && results.size === limit) break;

      const result = match(query, item.title);
      if (result.match) {
        results.set(item.id, { rank: result.score, item });
      }
    }
    const sorted = Array.from(results.entries());

    if (!sortOptions || sortOptions.sortBy === "relevance")
      sorted.sort(
        sortOptions?.sortDirection === "desc"
          ? (a, b) => a[1].rank - b[1].rank
          : (a, b) => b[1].rank - a[1].rank
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
    if (sortOptions?.sortBy === "relevance") sortOptions = undefined;
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
      },
      (items) => groupArray(items, () => `${items.length} results`)
    );
  }

  private toItems<T extends Item>(
    ids: string[],
    selector: FilteredSelector<T>,
    sortOptions?: SortOptions
  ) {
    if (!ids.length) return [];
    if (sortOptions?.sortBy === "relevance") sortOptions = undefined;
    return selector.items(ids, sortOptions);
  }

  async rebuild() {
    const db = this.db.sql() as unknown as Kysely<RawDatabaseSchema>;
    await rebuildSearchIndex(db);
  }
}

function highlightQueries(
  text: string,
  queries: string[]
): { text: string; hasMatches: boolean } {
  if (!text || !queries.length) return { text, hasMatches: false };

  const patterns = queries
    .filter((q) => q.length > 0)
    .map((q) => q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  if (patterns.length === 0) return { text, hasMatches: false };

  try {
    const regex = new RegExp(patterns.join("|"), "gi");

    let hasMatches = false;

    const result = text.replace(regex, (match) => {
      hasMatches = true;
      return `${MATCH_TAG_OPEN}${match}${MATCH_TAG_CLOSE}`;
    });

    return { text: result, hasMatches };
  } catch (error) {
    return { text, hasMatches: false };
  }
}

export function splitHighlightedMatch(text: string): Match[][] {
  const parts = text.split(MATCH_TAG_REGEX);
  const allMatches: Match[][] = [];
  let matches: Match[] = [];
  let totalLength = 0;

  for (let i = 0; i < parts.length - 1; i += 2) {
    const prefix = parts[i];
    const match = parts[i + 1];
    let suffix = parts.at(i + 2);
    const matchLength = prefix.length + match.length + (suffix?.length || 0);

    if (totalLength > 120 && matches.length > 0) {
      matches[matches.length - 1].suffix += "...";
      allMatches.push(matches);
      matches = [];
      totalLength = 0;
    }

    if (suffix) {
      suffix = suffix.replace(/\s{2,}/gm, " ");
      const [_suffix, remaining] = splitToNearestWord(
        suffix,
        Math.max(suffix.length / 2, 60)
      );
      parts[i + 2] = remaining;
      suffix = _suffix;
    }

    matches.push({
      match,
      prefix: prefix.replace(/\s{2,}/gm, " ").trimStart(),
      suffix: suffix || ""
    });

    totalLength += matchLength;
  }

  if (matches.length > 0) {
    matches[matches.length - 1].suffix += parts[parts.length - 1];
    allMatches.push(matches);
  }

  for (const matches of allMatches) {
    const totalLength = matches.reduce(
      (length, curr) =>
        length + curr.match.length + curr.prefix.length + curr.suffix.length,
      0
    );
    if (totalLength > 200) {
      const start = matches[0];
      const end = matches[matches.length - 1];

      const centered = centerMatch(
        start.prefix,
        end.suffix,
        totalLength - (start.prefix.length + end.suffix.length),
        {
          maxLength: 200
        }
      );

      start.prefix = centered.prefix || " ";
      end.suffix = centered.suffix || " ";
    }
  }
  return allMatches;
}

function splitToNearestWord(text: string, maxLength: number): [string, string] {
  if (text.length <= maxLength) return [text, ""];

  // Find the last space before maxLength
  let splitIndex = text.lastIndexOf(" ", maxLength);

  // If no space found, force split at maxLength
  if (splitIndex === -1) {
    splitIndex = maxLength;
  }

  const firstPart = text.substring(0, splitIndex);
  const remainingText = text.substring(splitIndex);

  return [firstPart, remainingText];
}

interface CenterOptions {
  maxLength?: number; // Maximum total length of output
  minContext?: number; // Minimum context on each side
  ellipsis?: string; // String to use for truncation
  preferLeft?: boolean; // Prefer more context on left when odd length
}

function centerMatch(
  prefix: string,
  suffix: string,
  matchLength: number,
  options: CenterOptions = {}
): { prefix?: string; suffix?: string } {
  const {
    maxLength = 120,
    minContext = 20,
    ellipsis = "...",
    preferLeft = true
  } = options;

  // Handle edge cases
  if (!match) return {};
  if (matchLength >= maxLength) return {};

  // Calculate available space for context
  const availableSpace = maxLength - matchLength;

  // Calculate initial context lengths
  let leftLength = Math.floor(availableSpace / 2);
  let rightLength = availableSpace - leftLength;

  // Adjust if we prefer left context
  if (preferLeft && availableSpace % 2 !== 0) {
    leftLength++;
    rightLength--;
  }

  // Ensure minimum context if possible
  if (leftLength < minContext && prefix.length > leftLength) {
    const diff = Math.min(rightLength - minContext, minContext - leftLength);
    if (diff > 0) {
      leftLength += diff;
      rightLength -= diff;
    }
  } else if (rightLength < minContext && suffix.length > rightLength) {
    const diff = Math.min(leftLength - minContext, minContext - rightLength);
    if (diff > 0) {
      rightLength += diff;
      leftLength -= diff;
    }
  }

  // Build result
  const left =
    prefix.length > leftLength ? ellipsis + prefix.slice(-leftLength) : prefix;
  const right =
    suffix.length > rightLength
      ? suffix.slice(0, rightLength) + ellipsis
      : suffix;

  return { prefix: left, suffix: right };
}

function stringToMatch(str: string): Match[] {
  return [
    {
      prefix: str,
      match: "",
      suffix: ""
    }
  ];
}
function highlightHtmlContent(html: string, queries: string[]): string {
  if (!html || !queries.length) return html;

  // Filter and escape regex special chars
  const patterns = queries
    .filter((q) => q && q.length > 0)
    .map((q) => q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  if (!patterns.length) return html;

  // Create single regex for all patterns
  const searchRegex = new RegExp(`(${patterns.join("|")})`, "gi");

  let result = "";

  // Stack to track elements and their buffered content
  interface ElementInfo {
    name: string;
    attributes: Record<string, string>;
    hasMatch: boolean;
    buffer: string;
  }
  const elementStack: ElementInfo[] = [];

  // Create parser instance
  const parser = new Parser(
    {
      ontext(text) {
        // Check for matches in text
        const hasMatch = searchRegex.test(text);
        // Reset regex state after test
        searchRegex.lastIndex = 0;

        const processed = text.replace(
          searchRegex,
          "<nn-search-result>$1</nn-search-result>"
        );

        if (hasMatch) {
          // Mark all ancestor elements as containing a match
          elementStack.forEach((el) => (el.hasMatch = true));
        }

        // Add text to current element's buffer or main result
        if (elementStack.length > 0) {
          elementStack[elementStack.length - 1].buffer += processed;
        } else {
          result += processed;
        }
      },
      onopentag(name, attributes) {
        // Create new element info
        elementStack.push({
          name,
          attributes: { ...attributes },
          hasMatch: false,
          buffer: ""
        });
      },
      onclosetag(_name) {
        const element = elementStack.pop();
        if (!element) return;

        let html = `<${element.name}`;

        // Process attributes based on match status
        for (const [key, value] of Object.entries(element.attributes)) {
          // auto expand outline list item if it has matches
          if (
            element.name === "li" &&
            key === "data-collapsed" &&
            element.hasMatch
          ) {
            continue;
          }

          // auto expand callout if it has matches
          if (
            element.name === "div" &&
            key === "class" &&
            value?.includes("callout") &&
            element.hasMatch
          ) {
            html += ` ${key}="callout"`;
            continue;
          }

          html += ` ${key}="${value}"`;
        }

        html += `>${element.buffer}</${element.name}>`;

        // Add to parent's buffer or main result
        if (elementStack.length > 0) {
          elementStack[elementStack.length - 1].buffer += html;
        } else {
          result += html;
        }
      },
      onprocessinginstruction(_name, data) {
        if (elementStack.length > 0) {
          elementStack[elementStack.length - 1].buffer += `<${data}>`;
        } else {
          result += `<${data}>`;
        }
      }
    },
    {
      decodeEntities: false,
      xmlMode: false
    }
  );

  // Parse the HTML
  parser.write(html);
  parser.end();

  return result;
}

interface MatchScoreOptions {
  lengthMultiplier: number; // Weight for match length
  positionPenalty: number; // Penalty for matches further down
  consecutiveBonus: number; // Bonus for different consecutive token matches
  repetitionPenalty: number; // Penalty for same token repeated consecutively
  uniqueTokenBonus: number; // Large bonus for each unique token matched
  completeWordBonus: number; // Bonus for complete word matches
}

const DEFAULT_SCORE_OPTIONS: MatchScoreOptions = {
  lengthMultiplier: 1.5, // Favor longer matches
  positionPenalty: 0.05, // Small penalty for each position down
  consecutiveBonus: 2.0, // Bonus for consecutive different tokens
  repetitionPenalty: 0.5, // Significant penalty for repetition
  uniqueTokenBonus: 10.0, // Large bonus for each unique token
  completeWordBonus: 5.0 // Significant bonus for complete word matches
};

function isCompleteWord(match: Match): boolean {
  const prefixEndsWithSpace = /\s$/.test(match.prefix) || match.prefix === "";
  const suffixStartsWithSpace = /^\s/.test(match.suffix) || match.suffix === "";
  return prefixEndsWithSpace && suffixStartsWithSpace;
}

function getMatchScore(
  matches: Match[],
  tokens: string[],
  options: MatchScoreOptions = DEFAULT_SCORE_OPTIONS
): number {
  let score = 0;
  let lastMatchText = "";
  let repetitionCount = 0;
  const uniqueTokens = new Set<string>();

  matches.forEach((match, index) => {
    const matchText = match.match.toLowerCase();
    let matchScore = 0;

    // Get matching tokens for this match
    const matchingTokens = tokens.filter((token) =>
      matchText.includes(token.toLowerCase())
    );

    // Add to unique tokens set
    matchingTokens.forEach((token) => {
      uniqueTokens.add(token.toLowerCase());
    });

    // Base score from match length
    matchScore += match.match.length * options.lengthMultiplier;

    // Check if it's a complete word only once per match
    if (isCompleteWord(match)) {
      matchScore += options.completeWordBonus;
    }

    // Position penalty
    matchScore *= 1 - index * options.positionPenalty;

    // Handle consecutive matches and repetition
    if (index > 0) {
      if (matchText === lastMatchText) {
        repetitionCount++;
        matchScore *= Math.pow(options.repetitionPenalty, repetitionCount);
      } else {
        matchScore *= options.consecutiveBonus;
        repetitionCount = 0;
      }
    }

    lastMatchText = matchText;
    score += matchScore;
  });

  // Add unique token bonus once at the end
  score += uniqueTokens.size * options.uniqueTokenBonus;

  return score;
}

function textContainsTokens(text: string, tokens: QueryTokens) {
  const lowerCasedText = text.toLowerCase();
  if (
    !tokens.notTokens.every(
      (t) => !lowerCasedText.includes(`${MATCH_TAG_OPEN}${t}${MATCH_TAG_CLOSE}`)
    )
  )
    return false;
  return (
    tokens.andTokens.every((t) =>
      lowerCasedText.includes(`${MATCH_TAG_OPEN}${t}${MATCH_TAG_CLOSE}`)
    ) ||
    tokens.orTokens.some((t) =>
      lowerCasedText.includes(`${MATCH_TAG_OPEN}${t}${MATCH_TAG_CLOSE}`)
    )
  );
}

function filterSmallTokens(tokens: QueryTokens | undefined) {
  if (!tokens) return;
  return [...tokens.andTokens, ...tokens.orTokens].filter(
    (token) => token.length < 3
  );
}

function transformTokens(tokens: QueryTokens | undefined) {
  if (!tokens)
    return {
      andTokens: [],
      orTokens: [],
      notTokens: [],
      allTokens: []
    };

  const andTokens = tokens.andTokens.map((t) =>
    t.replace(/"(.+)"/g, "$1").toLowerCase()
  );
  const orTokens = tokens.orTokens.map((t) =>
    t.replace(/"(.+)"/g, "$1").toLowerCase()
  );
  const notTokens = tokens.notTokens.map((t) =>
    t.replace(/"(.+)"/g, "$1").toLowerCase()
  );
  return {
    andTokens,
    orTokens,
    notTokens,
    allTokens: [...andTokens, ...orTokens]
  };
}
