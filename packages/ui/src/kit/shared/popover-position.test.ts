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
import { popoverPosition } from "./popover-position";

const window = { width: 1000, height: 800 };
const item = { x: 100, y: 300, width: 200, height: 30 };

describe("popoverPosition", () => {
  it("opens a submenu beside its item, level with it", () => {
    expect(popoverPosition(item, "right-start", window)).toEqual({
      top: 300,
      left: 305
    });
  });

  it("opens a submenu on the left when the right side has no room", () => {
    const edge = { ...item, x: 700 };
    expect(popoverPosition(edge, "right-start", window)).toEqual({
      top: 300,
      right: 305
    });
  });

  it("keeps below placements under the anchor", () => {
    expect(popoverPosition(item, "bottom-start", window)).toMatchObject({
      top: 335,
      left: 100
    });
    expect(popoverPosition(item, "bottom-end", window)).toMatchObject({
      top: 335,
      right: 700
    });
  });
});
