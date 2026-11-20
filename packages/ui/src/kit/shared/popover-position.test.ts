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
const menu = { width: 220, height: 200 };

describe("popoverPosition", () => {
  it("opens a submenu beside its item, level with it", async () => {
    expect(await popoverPosition(item, menu, "right-start", window)).toEqual({
      top: 300,
      left: 300
    });
  });

  it("flips a submenu to the left when the right side has no room", async () => {
    const edge = { ...item, x: 700 };
    expect(await popoverPosition(edge, menu, "right-start", window)).toEqual({
      top: 300,
      left: 480
    });
  });

  it("opens below the anchor, aligned to its start or end", async () => {
    expect(await popoverPosition(item, menu, "bottom-start", window)).toEqual({
      top: 335,
      left: 100
    });
    expect(await popoverPosition(item, menu, "bottom-end", window)).toEqual({
      top: 335,
      left: 80
    });
  });

  it("flips above when there is no room below", async () => {
    const low = { ...item, y: 700 };
    expect(await popoverPosition(low, menu, "bottom-start", window)).toEqual({
      top: 495,
      left: 100
    });
  });

  it("lines a low submenu up with its item's bottom edge", async () => {
    const tall = { width: 220, height: 400 };
    const low = { ...item, y: 600 };
    const { top } = await popoverPosition(low, tall, "right-start", window);
    expect(top).toBe(230);
  });

  it("shifts back inside the window", async () => {
    const wide = { width: 400, height: 100 };
    const edge = { ...item, x: 800 };
    const { left } = await popoverPosition(edge, wide, "bottom-start", window);
    expect(left).toBe(590);
  });
});
