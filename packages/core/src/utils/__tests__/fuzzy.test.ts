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

import { fuzzy } from "../fuzzy";
import { test, expect, describe } from "vitest";

describe("lookup.fuzzy", () => {
  describe("opts.sort", () => {
    test("should sort items by score when sort is true", () => {
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
      expect(
        fuzzy(query, items, "title", {
          sort: true
        })
      ).toStrictEqual([items[2], items[0], items[1]]);
    });
    test("should not sort items by score when sort is false", () => {
      const items = [
        {
          title: "system"
        },
        {
          title: "items"
        }
      ];
      const query = "lo";
      expect(
        fuzzy(query, items, "title", {
          sort: false
        })
      ).toStrictEqual([items[0], items[1]]);
    });
  });
  describe("opts.matchOnly", () => {
    test("should return all items when matchOnly is false", () => {
      const items = [
        {
          title: "hello"
        },
        {
          title: "world"
        }
      ];
      const successQuery = "o";
      const failureQuery = "i";
      expect(fuzzy(successQuery, items, "title")).toStrictEqual(items);
      expect(fuzzy(failureQuery, items, "title")).toStrictEqual(items);
    });
    test("should return only matching items when matchOnly is true", () => {
      const items = [
        {
          title: "hello"
        },
        {
          title: "world"
        }
      ];
      const successQuery = "or";
      const failureQuery = "i";
      expect(
        fuzzy(successQuery, items, "title", { matchOnly: true })
      ).toStrictEqual([items[1]]);
      expect(
        fuzzy(failureQuery, items, "title", { matchOnly: true })
      ).toStrictEqual([]);
    });
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
      ).toStrictEqual([items[0], { title: "worlprefix-d" }]);
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
      ).toStrictEqual([{ title: "hello-suffix" }, items[1]]);
    });
  });
});
