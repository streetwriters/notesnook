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
});
