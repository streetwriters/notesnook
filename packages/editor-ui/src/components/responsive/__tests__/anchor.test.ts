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
import { pickPopupAnchor, toPopoverRect } from "../anchor.js";

const control = { current: null };
const toolbar = { current: null };

describe("popup anchor", () => {
  test("converts the anchor query's edges to a position and size", () => {
    expect(toPopoverRect({ top: 20, left: 10, right: 40, bottom: 60 })).toEqual({
      x: 10,
      y: 20,
      width: 30,
      height: 40
    });
    expect(toPopoverRect(null)).toBeUndefined();
    expect(toPopoverRect(undefined)).toBeUndefined();
  });

  test("an explicit rect wins over the measured anchor and the control", () => {
    const anchorRect = { x: 1, y: 2, width: 3, height: 4 };
    const resolved = pickPopupAnchor({
      anchorRect,
      measured: { x: 9, y: 9, width: 9, height: 9 },
      anchorRef: control,
      fallbackRef: toolbar,
      placement: "top-end"
    });
    expect(resolved).toEqual({ anchorRect, placement: "top-end" });
  });

  test("the measured anchor wins over the control", () => {
    const measured = { x: 9, y: 8, width: 7, height: 6 };
    const resolved = pickPopupAnchor({
      measured,
      anchorRef: control,
      fallbackRef: toolbar
    });
    expect(resolved).toEqual({ anchorRect: measured, placement: "bottom-start" });
    expect(resolved.anchorRef).toBeUndefined();
  });

  test("a popup without an anchor opens at its control, then at the toolbar", () => {
    expect(
      pickPopupAnchor({ anchorRef: control, fallbackRef: toolbar }).anchorRef
    ).toBe(control);
    expect(pickPopupAnchor({ fallbackRef: toolbar }).anchorRef).toBe(toolbar);
  });
});
