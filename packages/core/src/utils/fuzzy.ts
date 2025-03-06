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

export function fuzzy<T extends { id: string }>(
  query: string,
  items: T[],
  fields: Partial<Record<keyof T, number>>,
  options: {
    limit?: number;
    prefix?: string;
    suffix?: string;
  } = {}
): T[] {
  const results: Map<
    string,
    {
      item: T;
      score: number;
    }
  > = new Map();

  for (const item of items) {
    if (options.limit && results.size >= options.limit) break;

    for (const field in fields) {
      const result = match(query, `${item[field]}`);
      if (!result.match) continue;

      const oldMatch = results.get(item.id);
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
        results.set(item.id, {
          item: clonedItem,
          score: result.score * (fields[field] || 1)
        });
      }
    }
  }

  if (results.size === 0) return [];

  const sorted = Array.from(results.entries());
  sorted.sort((a, b) => b[1].score - a[1].score);

  return sorted.map((item) => item[1].item);
}
