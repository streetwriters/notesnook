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

import { describe, it, expect } from "vitest";
import { nextIndexFrom } from "../src/hooks/use-keyboard-list-navigation";

describe("nextIndexFrom", () => {
  it("steps down and up one row", () => {
    expect(nextIndexFrom(2, 1, 5)).toBe(3);
    expect(nextIndexFrom(2, -1, 5)).toBe(1);
  });

  it("wraps around both ends", () => {
    expect(nextIndexFrom(4, 1, 5)).toBe(0);
    expect(nextIndexFrom(0, -1, 5)).toBe(4);
  });

  it("steps over rows the skip callback rejects", () => {
    const skip = (index: number) => index === 1 || index === 2;
    expect(nextIndexFrom(0, 1, 4, skip)).toBe(3);
    expect(nextIndexFrom(3, -1, 4, skip)).toBe(0);
  });

  it("wraps while skipping", () => {
    const skip = (index: number) => index === 0;
    expect(nextIndexFrom(3, 1, 4, skip)).toBe(1);
  });

  it("returns the current index when every row is skipped", () => {
    expect(nextIndexFrom(1, 1, 3, () => true)).toBe(1);
    expect(nextIndexFrom(1, -1, 3, () => true)).toBe(1);
  });

  it("reaches the only index in a single row list", () => {
    expect(nextIndexFrom(0, 1, 1)).toBe(0);
    expect(nextIndexFrom(0, -1, 1)).toBe(0);
  });

  it("moves from the initial cursor of -1 like any other row", () => {
    expect(nextIndexFrom(-1, 1, 4)).toBe(0);
    expect(nextIndexFrom(-1, -1, 4)).toBe(3);
  });
});
