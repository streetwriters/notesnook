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

import { describe, expect, it } from "vitest";
import {
  computeOffsets,
  indexAt,
  scrollOffsetFor,
  visibleRange
} from "./virtual-window";

describe("virtual window", () => {
  it("uses measured sizes over the estimate", () => {
    const offsets = computeOffsets(4, 10, new Map([[1, 30]]));
    expect(Array.from(offsets)).toEqual([0, 10, 40, 50, 60]);
  });

  it("finds the item at a position", () => {
    const offsets = computeOffsets(4, 10, new Map([[1, 30]]));
    expect(indexAt(offsets, 0)).toBe(0);
    expect(indexAt(offsets, 10)).toBe(1);
    expect(indexAt(offsets, 39)).toBe(1);
    expect(indexAt(offsets, 40)).toBe(2);
    expect(indexAt(offsets, 9999)).toBe(3);
  });

  it("mounts only a window of a long list", () => {
    const offsets = computeOffsets(100000, 20, new Map());
    const { start, end } = visibleRange(offsets, 20000, 400, 100);
    expect(start).toBe(995);
    expect(end - start + 1).toBeLessThan(40);
  });

  it("handles an empty list", () => {
    const offsets = computeOffsets(0, 20, new Map());
    expect(visibleRange(offsets, 0, 400, 100).end).toBe(-1);
  });

  it("computes scroll offsets per alignment", () => {
    const offsets = computeOffsets(100, 20, new Map());
    expect(scrollOffsetFor(offsets, 10, 100, "start")).toBe(200);
    expect(scrollOffsetFor(offsets, 10, 100, "end")).toBe(120);
    expect(scrollOffsetFor(offsets, 10, 100, "center")).toBe(160);
  });
});
