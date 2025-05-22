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
import { AnyColumnWithTable, Kysely, sql } from "@streetwriters/kysely";
import { FilteredSelector } from "../database/sql-collection.js";
import { VirtualizedGrouping } from "../utils/virtualized-grouping.js";
import { logger } from "../logger.js";
import { rebuildSearchIndex } from "../database/fts.js";
import { transformQuery } from "../utils/query-transformer.js";
import { getSortSelectors, groupArray } from "../utils/grouping.js";
import { fuzzy } from "../utils/fuzzy.js";
import { extractMatchingBlocks, extractText } from "../utils/html-parser.js";
import { findOrAdd } from "../utils/array.js";

type SearchResults<T> = {
  sorted: (sortOptions?: SortOptions) => Promise<VirtualizedGrouping<T>>;
  items: (sortOptions?: SortOptions) => Promise<T[]>;
  ids: (sortOptions?: SortOptions) => Promise<string[]>;
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

  async notes(
    query: string,
    sortOptions?: SortOptions,
    notes?: FilteredSelector<Note>
  ): Promise<VirtualizedGrouping<HighlightedResult>> {
    const db = this.db.sql() as unknown as Kysely<RawDatabaseSchema>;
    const excludedIds = this.db.trash.cache.notes;

    const { query: transformedQuery, tokens } = transformQuery(query);

    let mergedResults: HighlightedResult[] = [];
    if (transformedQuery.length > 0) {
      console.time("sql lookup");
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
            .where("title", "match", transformedQuery)
            .select([
              "id",
              sql<string>`'title'`.as("type"),
              sql<string>`highlight(notes_fts, 1, '<nn-search-result>', '</nn-search-result>')`.as(
                "match"
              ),
              sql<number>`rank * 10`.as("rank")
            ])
            .unionAll((eb) =>
              eb
                .selectFrom("content_fts")
                .$if(!!notes, (eb) =>
                  eb.where("noteId", "in", notes!.filter.select("id"))
                )
                .$if(excludedIds.length > 0, (eb) =>
                  eb.where("noteId", "not in", excludedIds)
                )
                .where("data", "match", transformedQuery)
                .select([
                  "noteId as id",
                  sql<string>`'content'`.as("type"),
                  sql<string>`highlight(content_fts, 2, '<nn-search-result>', '</nn-search-result>')`.as(
                    "match"
                  ),
                  "rank"
                ])
                .$castTo<{
                  id: string;
                  type: string;
                  rank: number;
                  match: string;
                }>()
            )
            .as("results")
        )
        .select(["results.id", "results.match", "results.type", "results.rank"])
        .execute()
        .catch((e) => {
          logger.error(e, `Error while searching`, { query });
          return [];
        });
      console.timeEnd("sql lookup");

      console.time("merge results");
      for (const result of results) {
        const old = findOrAdd(mergedResults, (r) => r.id === result.id, {
          type: "searchResult",
          id: result.id,
          content: [],
          title: [],
          rank: 0,
          rawContent: ""
        });

        if (result.type === "content") {
          old.content = extractMatchingBlocks(
            result.match,
            MATCH_TAG_NAME
          ).flatMap((block) => {
            return splitHighlightedMatch(block);
          });
          old.rawContent = result.match;
        }
        if (result.type === "title")
          old.title = splitHighlightedMatch(result.match).flatMap((m) => m);
        old.rank += result.rank;
      }
      console.timeEnd("merge results");
    }

    const smallTokens = Array.from(
      new Set(
        tokens.filter((token) => token.length < 3 && token !== "OR")
      ).values()
    );

    if (smallTokens.length > 0) {
      const ids = mergedResults.map((r) => r.id);
      console.time("fetch titles");
      const titles = await db
        .selectFrom("notes")
        .$if(!!transformedQuery && ids.length > 0, (eb) =>
          eb.where("id", "in", ids)
        )
        .select(["id", "title"])
        .execute();
      console.timeEnd("fetch titles");

      console.time("fetch htmls");
      const htmls = await db
        .selectFrom("content")
        .where("content.locked", "!=", true)
        .$if(!!transformedQuery && ids.length > 0, (eb) =>
          eb.where("noteId", "in", ids)
        )
        .select(["data", "noteId as id"])
        .$castTo<{ data: string; id: string }>()
        .execute();
      console.timeEnd("fetch htmls");

      console.time("small token lookup");
      for (let i = 0; i < titles.length; i++) {
        const title = titles[i];
        const html = htmls.find((h) => h.id === title.id);
        const text = html ? extractText(html.data) : "";

        if (
          (title.title &&
            smallTokens.every((token) => !!title.title?.includes(token))) ||
          (text && smallTokens.every((token) => !!text?.includes(token)))
        ) {
          const result = findOrAdd(mergedResults, (r) => r.id === title.id, {
            id: title.id,
            title: stringToMatch(title.title || ""),
            type: "searchResult",
            content: [],
            rank: 0
          });

          const merged = mergeMatches(
            result.title,
            splitHighlightedMatch(
              highlightQueries(title.title || "", smallTokens)
            ).flatMap((m) => m)
          );
          if (merged) result.title = merged;

          result.content.push(
            ...splitHighlightedMatch(highlightQueries(text, smallTokens))
          );
        }
      }
      console.timeEnd("small token lookup");
    }

    const resultsWithMissingTitle = mergedResults
      .filter((r) => !r.title.length)
      .map((r) => r.id);

    if (resultsWithMissingTitle.length > 0) {
      console.time("missing title");
      const titles = await db
        .selectFrom("notes")
        .where("id", "in", resultsWithMissingTitle)
        .select(["id", "title"])
        .execute();
      for (const title of titles) {
        const result = mergedResults.find((r) => r.id === title.id);
        if (!result || !title.title) continue;
        result.title = stringToMatch(title.title);
      }
      console.timeEnd("missing title");
    }

    mergedResults = mergedResults.filter((r) => !!r.title.length);

    if (!sortOptions || sortOptions.sortBy === "relevance")
      mergedResults.sort(
        sortOptions?.sortDirection === "desc"
          ? (a, b) => a.rank - b.rank
          : (a, b) => b.rank - a.rank
      );
    else {
      const sortedNoteIds = await this.db.notes.all.fields(["notes.id"]).items(
        mergedResults.map((r) => r.id),
        sortOptions
      );
      const sorted: HighlightedResult[] = [];
      for (const { id } of sortedNoteIds) {
        const resultForId = mergedResults.find((r) => r.id === id);
        if (!resultForId) continue;
        sorted.push(resultForId);
      }
      mergedResults = sorted;
    }
    return arrayToVirtualizedGrouping(mergedResults, this.db.options.batchSize);
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
        const { ids, items } = await this.filterTrash(query, sortOptions);
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
      items: async (sortOptions?: SortOptions) => {
        const { items } = await this.filterTrash(query, sortOptions);
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
    return this.toSearchResults(async (sortOptions) => {
      const results = await this.filter(selector, query, fields, {
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
    ids: (sortOptions?: SortOptions) => Promise<string[]>,
    selector: FilteredSelector<T>
  ): SearchResults<T> {
    return {
      sorted: async (sortOptions?: SortOptions) =>
        this.toVirtualizedGrouping(
          await ids(sortOptions),
          selector,
          sortOptions
        ),
      items: async (sortOptions?: SortOptions) =>
        this.toItems(await ids(sortOptions), selector, sortOptions),
      ids
    };
  }

  private async filterTrash(query: string, sortOptions?: SortOptions) {
    const items = await this.db.trash.all();

    const results: Map<string, { rank: number; item: TrashItem }> = new Map();
    for (const item of items) {
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

function highlightQueries(text: string, queries: string[]): string {
  if (!text || !queries.length) return text;

  // Collect all ranges
  const ranges = [];
  const lowerText = text.toLowerCase();

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    const lowerQuery = query.toLowerCase();
    const queryLen = query.length;
    let pos = 0;

    while ((pos = lowerText.indexOf(lowerQuery, pos)) !== -1) {
      ranges.push({
        start: pos,
        end: pos + queryLen,
        len: queryLen
      });
      pos += 1;
    }
  }

  if (!ranges.length) return text;

  // Sort by start position, then by length (longer first)
  ranges.sort((a, b) => a.start - b.start || b.len - a.len);

  // Filter overlaps and merge adjacent ranges
  const merged = [ranges[0]];
  for (let i = 1; i < ranges.length; i++) {
    const current = ranges[i];
    const previous = merged[merged.length - 1];

    if (current.start > previous.end) {
      // No overlap or adjacency - add as new range
      merged.push(current);
    } else if (current.start === previous.end) {
      // Adjacent ranges - merge them
      previous.end = current.end;
      previous.len = previous.end - previous.start;
    }
    // Overlapping ranges are skipped
  }

  // Build result using array of parts
  const parts = [];
  let lastEnd = 0;

  for (const { start, end } of merged) {
    if (start > lastEnd) {
      parts.push(text.slice(lastEnd, start));
    }
    parts.push(MATCH_TAG_OPEN, text.slice(start, end), MATCH_TAG_CLOSE);
    lastEnd = end;
  }

  if (lastEnd < text.length) {
    parts.push(text.slice(lastEnd));
  }

  return parts.join("");
}

function arrayToVirtualizedGrouping<T extends { id: string }>(
  array: T[],
  batchSize: number
): VirtualizedGrouping<T> {
  return new VirtualizedGrouping<T>(
    array.length,
    batchSize,
    () => Promise.resolve(array.map((c) => c.id)),
    async (start, end) => {
      const items = array.slice(start, end);
      return {
        ids: items.map((i) => i.id),
        items
      };
    },
    (items) => groupArray(items, () => `${items.length} results`)
  );
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

type Match = {
  prefix: string;
  match: string;
  suffix: string;
};

function mergeMatches(matches1: Match[], matches2: Match[]): Match[] | null {
  if (!matches1.length) return matches2;
  if (!matches2.length) return matches1;

  // Helper to get full text from matches array
  function getFullText(matches: Match[]): string {
    if (!matches.length) return "";
    return matches.reduce(
      (text, curr) => text + curr.prefix + curr.match + curr.suffix,
      ""
    );
  }

  // Get the full original text
  const text = getFullText(matches1);
  if (getFullText(matches2) !== text) return null;

  // Create array of all match positions
  type Position = {
    start: number;
    end: number;
    match: string;
  };

  function getPositions(matches: Match[]) {
    const positions: Position[] = [];
    let pos = 0;
    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      pos += m.prefix.length;
      positions.push({
        start: pos,
        end: pos + m.match.length,
        match: m.match
      });
      pos += m.match.length + m.suffix.length;
    }
    return positions;
  }

  const positions = [...getPositions(matches1), ...getPositions(matches2)].sort(
    (a, b) => a.start - b.start || b.end - a.end
  );

  // Merge overlapping or adjacent positions
  const merged: Position[] = [];
  let current = positions[0];

  for (let i = 1; i < positions.length; i++) {
    const next = positions[i];
    if (next.start <= current.end) {
      // Overlapping or adjacent matches
      if (next.end > current.end) {
        // Extend current match if next one is longer
        current = {
          start: current.start,
          end: next.end,
          match: text.slice(current.start, next.end)
        };
      }
    } else {
      merged.push(current);
      current = next;
    }
  }
  merged.push(current);

  // Create final matches array
  const result: Match[] = [];
  for (let i = 0; i < merged.length; i++) {
    const pos = merged[i];
    const nextPos = merged[i + 1];

    const prefix = i === 0 ? text.slice(0, pos.start) : "";
    const match = pos.match;
    const suffix = nextPos
      ? text.slice(pos.end, nextPos.start)
      : text.slice(pos.end);

    result.push({ prefix, match, suffix });
  }

  return result;
}
