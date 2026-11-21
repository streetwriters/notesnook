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
  imageRatio,
  setImageAlignmentCommand,
  setImageSizeCommand,
  sizeForHeight,
  sizeForWidth
} from "../image-size.js";

describe("image properties sizing", () => {
  test("a stored aspect ratio wins over the current size", () => {
    expect(imageRatio({ width: 100, height: 100, aspectRatio: 2 })).toBe(2);
  });

  test("the native editor keeps only a size: the ratio comes from it", () => {
    const image = { width: 320, height: 200 };
    expect(imageRatio(image)).toBe(1.6);
    expect(sizeForWidth(image, "160")).toEqual({ width: 160, height: 100 });
    expect(sizeForHeight(image, "100")).toEqual({ width: 160, height: 100 });
  });

  test("sizes are whole pixels", () => {
    expect(sizeForWidth({ aspectRatio: 3 }, "100")).toEqual({
      width: 100,
      height: 33
    });
  });

  test("without a ratio an image is not squashed into a square", () => {
    expect(imageRatio({})).toBe(0);
    expect(sizeForWidth({}, "50")).toEqual({ width: 50 });
    expect(sizeForHeight({ width: 80 }, "50")).toEqual({
      width: 80,
      height: 50,
      locked: false
    });
    expect(sizeForHeight({}, "50")).toBeNull();
  });

  test("typing a width digit by digit uses the ratio from the start", () => {
    const ratio = 1.6;
    // Each step resizes the image, so the popup keeps the first ratio rather
    // than re-reading it from the rounded size.
    const sizes = ["1", "12", "120"].map((t) => sizeForWidth({}, t, ratio));
    expect(sizes).toEqual([
      { width: 1, height: 1 },
      { width: 12, height: 8 },
      { width: 120, height: 75 }
    ]);
  });

  test("empty, zero, negative and non-numeric input changes nothing", () => {
    const image = { width: 320, height: 200 };
    for (const text of ["", "0", "-5", "abc", "Infinity", "NaN"]) {
      expect(sizeForWidth(image, text)).toBeNull();
      expect(sizeForHeight(image, text)).toBeNull();
    }
  });

  test("commands name the engine's commands with plain arguments", () => {
    expect(setImageSizeCommand({ width: 1, height: 2 })).toEqual({
      name: "setImageSize",
      args: [{ width: 1, height: 2 }]
    });
    expect(setImageAlignmentCommand("right")).toEqual({
      name: "setImageAlignment",
      args: [{ align: "right" }]
    });
  });
});
