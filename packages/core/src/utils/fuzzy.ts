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
import { clone } from "./clone.js";

export function fuzzy<T>(
  query: string,
  items: T[],
  getIdentifier: (item: T) => string,
  fields: Partial<Record<keyof T, number>>,
  options: {
    limit?: number;
    prefix?: string;
    suffix?: string;
  } = {}
): T[] {
  const results = fuzzyMatch(query, items, getIdentifier, fields, options);
  if (results.size === 0) return [];

  // if the query contains spaces & other non-alphanumeric characters, then we
  // should search again with a sanitized query to catch more matches.
  const sanitizedQuery = sanitize(query);
  if (sanitizedQuery !== query) {
    for (const [key, value] of fuzzyMatch(
      sanitizedQuery,
      items,
      getIdentifier,
      fields,
      options
    )) {
      const matchInFirstSearch = results.get(key);
      if (matchInFirstSearch) {
        // just give it an extra bump because matches from first search
        // must always be higher as they probably match much more closely
        // with the query given by the user.
        matchInFirstSearch.score += value.score;
        continue;
      }
      results.set(key, value);
    }
  }

  const matches = Array.from(results.entries())
    .sort((a, b) => b[1].score - a[1].score)
    .map((item) => item[1].item);

  return matches;
}

function fuzzyMatch<T>(
  query: string,
  items: T[],
  getIdentifier: (item: T) => string,
  fields: Partial<Record<keyof T, number>>,
  options: {
    limit?: number;
    prefix?: string;
    suffix?: string;
  } = {}
) {
  const results: Map<
    string,
    {
      item: T;
      score: number;
    }
  > = new Map();

  for (const item of items) {
    if (options.limit && results.size >= options.limit) break;

    const identifier = getIdentifier(item);

    for (const field in fields) {
      const value = `${item[field]}`;
      const result = match(query, value);
      if (!result.match) continue;

      const oldMatch = results.get(identifier);
      const clonedItem = oldMatch?.item || clone(item);

      if (options.suffix || options.prefix) {
        clonedItem[field] = surround(`${clonedItem[field]}`, {
          suffix: options.suffix,
          prefix: options.prefix,
          result
        }) as T[Extract<keyof T, string>];
      }
      if (oldMatch) {
        oldMatch.score += result.score * (fields[field] || 1);
      } else {
        results.set(identifier, {
          item: clonedItem,
          score: result.score * (fields[field] || 1)
        });
      }
    }
  }
  return results;
}

const SEPARATORS = /[^a-zA-Z0-9]+/g;
function sanitize(str: string): string {
  return str.replace(SEPARATORS, "").trim() || str;
}
