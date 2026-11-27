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

import { expect, test } from "vitest";
import {
  defaultCalculateViewLocation,
  groupRows,
  rowOfGroup,
  rowOfIndex,
  rowOfItem,
  toRowTarget
} from "./virtuoso-location";

test("group rows are each header followed by its items, numbered across groups", () => {
  expect(groupRows([1, 0, 2])).toEqual([
    { type: "group", groupIndex: 0 },
    { type: "item", groupIndex: 0, index: 0 },
    { type: "group", groupIndex: 1 },
    { type: "group", groupIndex: 2 },
    { type: "item", groupIndex: 2, index: 1 },
    { type: "item", groupIndex: 2, index: 2 }
  ]);
  expect(groupRows([])).toEqual([]);
});

test("an item's row skips the headers before it; out of range is undefined", () => {
  expect(rowOfItem([1, 0, 2], 0)).toBe(1);
  expect(rowOfItem([1, 0, 2], 1)).toBe(4);
  expect(rowOfItem([1, 0, 2], 2)).toBe(5);
  expect(rowOfItem([1, 0, 2], 3)).toBeUndefined();
  expect(rowOfItem([1, 0, 2], -1)).toBeUndefined();
  expect(rowOfItem([1, 0, 2], 1.5)).toBeUndefined();
  expect(rowOfItem([], 0)).toBeUndefined();
});

test("a group's row is its header's", () => {
  expect(rowOfGroup([1, 0, 2], 0)).toBe(0);
  expect(rowOfGroup([1, 0, 2], 1)).toBe(2);
  expect(rowOfGroup([1, 0, 2], 2)).toBe(3);
  expect(rowOfGroup([1, 0, 2], 3)).toBeUndefined();
  expect(rowOfGroup([1, 0, 2], -1)).toBeUndefined();
});

test("a flat index is clamped to the list, and nothing in an empty list", () => {
  expect(rowOfIndex(10, "LAST")).toBe(9);
  expect(rowOfIndex(10, 99)).toBe(9);
  expect(rowOfIndex(10, -4)).toBe(0);
  expect(rowOfIndex(10, 2.9)).toBe(2);
  expect(rowOfIndex(10, NaN)).toBeUndefined();
  expect(rowOfIndex(0, 0)).toBeUndefined();
  expect(rowOfIndex(0, "LAST")).toBeUndefined();
});

test("a location that names no row gives no target", () => {
  expect(toRowTarget(3, () => undefined)).toBeUndefined();
  expect(toRowTarget({ index: 3, align: "end" }, () => 7)).toEqual({
    index: 7,
    animated: false,
    viewPosition: 1
  });
});

test("the default view location scrolls up to the start and down to the end", () => {
  const view = { viewportTop: 100, viewportBottom: 500 };
  const at = (itemTop: number, itemBottom: number) =>
    defaultCalculateViewLocation({
      ...view,
      itemTop,
      itemBottom,
      locationParams: { index: 4, behavior: "smooth" }
    });
  expect(at(50, 90)).toEqual({ index: 4, behavior: "smooth", align: "start" });
  expect(at(480, 520)).toEqual({ index: 4, behavior: "smooth", align: "end" });
  expect(at(100, 500)).toBeNull();
});
