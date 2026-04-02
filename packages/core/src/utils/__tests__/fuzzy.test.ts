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

import { fuzzy } from "../fuzzy.js";
import { test, expect, describe } from "vitest";

describe("lookup.fuzzy", () => {
  test("should sort items by score", () => {
    const items = [
      {
        id: "1",
        title: "system"
      },
      {
        id: "2",
        title: "hello"
      },
      {
        id: "3",
        title: "items"
      }
    ];
    const query = "ems";
    expect(fuzzy(query, items, (item) => item.id, { title: 1 })).toStrictEqual([
      items[2]
    ]);
  });
  describe("opts.prefix", () => {
    test("should prefix matched field with provided value when given", () => {
      const items = [
        {
          id: "1",
          title: "hello"
        },
        {
          id: "2",
          title: "world"
        }
      ];
      const query = "d";
      expect(
        fuzzy(
          query,
          items,
          (item) => item.id,
          { title: 1 },
          {
            prefix: "prefix-"
          }
        )
      ).toStrictEqual([{ id: "2", title: "worlprefix-d" }]);
    });
  });
  describe("opt.suffix", () => {
    test("should suffix matched field with provided value when given", () => {
      const items = [
        {
          id: "1",
          title: "hello"
        },
        {
          id: "2",
          title: "world"
        }
      ];
      const query = "llo";
      expect(
        fuzzy(
          query,
          items,
          (item) => item.id,
          { title: 1 },
          {
            suffix: "-suffix"
          }
        )
      ).toStrictEqual([{ id: "1", title: "hello-suffix" }]);
    });
  });

  describe("separator normalization", () => {
    const items = [
      { id: "1", title: "file search.jpg" },
      { id: "2", title: "file-search.jpg" },
      { id: "3", title: "file_search.jpg" },
      { id: "4", title: "file____search-393.jpg" },
      { id: "5", title: "note-393.jpg" }
    ];

    test("query with space matches all separator variants", () => {
      const result = fuzzy("fl srch", items, (i) => i.id, { title: 1 });
      expect(result).toStrictEqual(items.slice(0, 4));
    });

    test("variants with only separators should match", () => {
      const result = fuzzy(
        "---",
        [
          { id: "1", title: "--------.jpg" },
          { id: "2", title: "abc.jpg" }
        ],
        (i) => i.id,
        { title: 1 }
      );
      expect(result).toStrictEqual([{ id: "1", title: "--------.jpg" }]);
    });

    test("query with special character between words matches all separator variants", () => {
      let result = fuzzy("file_search", items, (i) => i.id, { title: 1 });
      expect(result).toStrictEqual([items[2], items[3], items[0], items[1]]);

      result = fuzzy("file-search", items, (i) => i.id, { title: 1 });
      expect(result).toStrictEqual([items[1], items[0], items[2], items[3]]);
    });
  });
});
