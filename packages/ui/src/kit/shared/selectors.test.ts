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

import { describe, expect, test } from "vitest";
import {
  matchRules,
  parseSelector,
  selectorRules
} from "./style/selectors";

describe("parseSelector", () => {
  test("a nested tag, with or without &", () => {
    expect(parseSelector("& strong")).toEqual([{ tag: "strong", classes: [] }]);
    expect(parseSelector("strong")).toEqual([{ tag: "strong", classes: [] }]);
    expect(parseSelector("& > label")).toEqual([{ tag: "label", classes: [] }]);
  });

  test("classes, ids and lists", () => {
    expect(parseSelector(".tooltip")).toEqual([{ classes: ["tooltip"] }]);
    expect(parseSelector("& .a.b")).toEqual([{ classes: ["a", "b"] }]);
    expect(parseSelector("#profile-picture-edit")).toEqual([
      { classes: [], id: "profile-picture-edit" }
    ]);
    expect(parseSelector("th, td")).toEqual([
      { tag: "th", classes: [] },
      { tag: "td", classes: [] }
    ]);
    expect(parseSelector("& > *")).toEqual([{ classes: [] }]);
  });

  test("the last compound of a longer selector is what is matched", () => {
    expect(parseSelector(".list li span.title")).toEqual([
      { tag: "span", classes: ["title"] }
    ]);
  });

  test("states, pseudo elements, media queries and attributes are not rules", () => {
    for (const key of [
      ":hover",
      "&:hover",
      "&:hover .tooltip",
      ":hover #profile-picture-edit",
      "&::-webkit-scrollbar",
      "::placeholder",
      ":first-of-type",
      "@media (min-width: 480px)",
      '[data-viewport-type="element"]',
      "& + svg",
      ":group-hover"
    ])
      expect(parseSelector(key), key).toBeUndefined();
  });

  test("a bare word that is not an HTML tag is not a selector", () => {
    expect(parseSelector("variant")).toBeUndefined();
    expect(parseSelector("keyframes")).toBeUndefined();
    expect(parseSelector("")).toBeUndefined();
  });
});

describe("selectorRules", () => {
  test("picks the nested selector objects and nothing else", () => {
    const rules = selectorRules({
      color: "accent",
      gap: [1, 2],
      ":hover": { color: "red" },
      input: { p: 0 },
      "& strong": { color: "accent" },
      "th, td": { p: 1 }
    });
    expect(rules).toEqual([
      { targets: [{ tag: "strong", classes: [] }], style: { color: "accent" } },
      {
        targets: [
          { tag: "th", classes: [] },
          { tag: "td", classes: [] }
        ],
        style: { p: 1 }
      }
    ]);
    expect(selectorRules({ color: "accent" })).toBeUndefined();
  });
});

describe("matchRules", () => {
  const rules = selectorRules({
    "& strong": { color: "accent", fontWeight: "bold" },
    ".note": { color: "paragraph" },
    "strong.note": { fontWeight: 400 },
    "#one": { opacity: 0.5 }
  })!;

  test("an element takes the rules naming its tag, class or id", () => {
    expect(matchRules(rules, { tag: "strong" })).toEqual({
      color: "accent",
      fontWeight: "bold"
    });
    expect(matchRules(rules, { tag: "span", id: "one" })).toEqual({
      opacity: 0.5
    });
  });

  test("later rules win over earlier ones", () => {
    expect(
      matchRules(rules, { tag: "strong", className: "selectable note" })
    ).toEqual({ color: "paragraph", fontWeight: 400 });
  });

  test("an element no rule names takes nothing", () => {
    expect(matchRules(rules, { tag: "span" })).toBeUndefined();
    expect(matchRules(rules, {})).toBeUndefined();
    expect(matchRules([], { tag: "strong" })).toBeUndefined();
  });
});
