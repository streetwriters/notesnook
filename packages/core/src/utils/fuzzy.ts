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

export function fuzzy<T>(
  query: string,
  items: T[],
  key: keyof T,
  opts?: {
    prefix?: string;
    suffix?: string;
  }
): T[] {
  if (query === "") return items;

  const fuzzied: [T, number][] = [];

  for (const item of items) {
    const result = match(query, `${item[key]}`);
    if (!result.match) continue;

    if (opts?.prefix || opts?.suffix) {
      fuzzied.push([
        {
          ...item,
          [key]: surround(`${item[key]}`, {
            result: result,
            prefix: opts?.prefix,
            suffix: opts?.suffix
          })
        },
        result.score
      ]);
    } else fuzzied.push([item, result.score]);
  }

  return fuzzied.sort((a, b) => b[1] - a[1]).map((f) => f[0]);
}
