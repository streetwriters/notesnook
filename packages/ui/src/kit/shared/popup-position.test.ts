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
import { popupPosition } from "./popup-position";

const window = { width: 1000, height: 800 };
const popup = { width: 200, height: 100 };
const target = { x: 400, y: 300, width: 60, height: 20 };

test("with no location it opens over its target's top-left corner", () => {
  expect(popupPosition(target, popup, {}, window)).toEqual({
    top: 300,
    left: 400
  });
});

test("each location puts it on that side of the target", () => {
  const at = (location: "below" | "top" | "right" | "left") =>
    popupPosition(target, popup, { location }, window);
  expect(at("below")).toEqual({ top: 320, left: 400 });
  expect(at("top")).toEqual({ top: 200, left: 400 });
  expect(at("right")).toEqual({ top: 300, left: 460 });
  expect(at("left")).toEqual({ top: 300, left: 200 });
});

test("align centres it on the target or lines up their far edges", () => {
  expect(
    popupPosition(target, popup, { location: "below", align: "center" }, window)
  ).toEqual({ top: 320, left: 330 });
  expect(
    popupPosition(target, popup, { location: "right", align: "end" }, window)
  ).toEqual({ top: 220, left: 460 });
});

test("offsets and gap move it as the web's getPosition does", () => {
  expect(
    popupPosition(
      target,
      popup,
      { location: "below", yOffset: 8, xOffset: 3 },
      window
    )
  ).toEqual({ top: 328, left: 403 });
  expect(
    popupPosition(
      target,
      popup,
      { location: "right", gap: 5, xOffset: 2, yOffset: 4 },
      window
    )
  ).toEqual({ top: 296, left: 467 });
  expect(
    popupPosition(
      target,
      popup,
      { location: "left", gap: 5, xOffset: 2 },
      window
    )
  ).toEqual({ top: 300, left: 197 });
});

test("it flips to the other side when it does not fit, and only when that is better", () => {
  const low = { x: 400, y: 750, width: 60, height: 20 };
  expect(popupPosition(low, popup, { location: "below" }, window)).toEqual({
    top: 650,
    left: 400
  });
  const right = { x: 900, y: 300, width: 60, height: 20 };
  expect(popupPosition(right, popup, { location: "right" }, window)).toEqual({
    top: 300,
    left: 700
  });
  // Too big for either side: stays below and is kept inside the window.
  const tiny = { width: 300, height: 150 };
  expect(
    popupPosition(
      { x: 50, y: 60, width: 10, height: 10 },
      popup,
      { location: "below" },
      tiny
    )
  ).toEqual({ top: 40, left: 50 });
});

test("it is kept 10px inside the window's edges", () => {
  expect(
    popupPosition({ x: 990, y: 5, width: 0, height: 0 }, popup, {}, window)
  ).toEqual({ top: 10, left: 790 });
  expect(
    popupPosition({ x: -50, y: 300, width: 0, height: 0 }, popup, {}, window)
  ).toEqual({ top: 300, left: 10 });
});

test("a popup taller than the window is capped and starts at the top", () => {
  expect(
    popupPosition(target, { width: 200, height: 2000 }, {}, window)
  ).toEqual({ top: 10, left: 400, maxHeight: 780 });
});

test("a zero-sized window does not produce NaN", () => {
  const result = popupPosition(target, popup, {}, { width: 0, height: 0 });
  expect(Number.isFinite(result.top)).toBe(true);
  expect(Number.isFinite(result.left)).toBe(true);
});
