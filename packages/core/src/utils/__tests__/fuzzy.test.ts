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
        title: "system"
      },
      {
        title: "hello"
      },
      {
        title: "items"
      }
    ];
    const query = "ems";
    expect(fuzzy(query, items, "title")).toStrictEqual([items[2]]);
  });
  describe("opts.prefix", () => {
    test("should prefix matched field with provided value when given", () => {
      const items = [
        {
          title: "hello"
        },
        {
          title: "world"
        }
      ];
      const query = "d";
      expect(
        fuzzy(query, items, "title", {
          prefix: "prefix-"
        })
      ).toStrictEqual([{ title: "worlprefix-d" }]);
    });
  });
  describe("opt.suffix", () => {
    test("should suffix matched field with provided value when given", () => {
      const items = [
        {
          title: "hello"
        },
        {
          title: "world"
        }
      ];
      const query = "llo";
      expect(
        fuzzy(query, items, "title", {
          suffix: "-suffix"
        })
      ).toStrictEqual([{ title: "hello-suffix" }]);
    });
  });
});
