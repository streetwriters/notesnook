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
import { convertDeclarations, expandFlex } from "./convert";

describe("flex shorthand", () => {
  test("a bare number is grow with a 0% basis", () => {
    expect(expandFlex(1)).toEqual({
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: "0%"
    });
    expect(expandFlex("2")).toEqual({
      flexGrow: 2,
      flexShrink: 1,
      flexBasis: "0%"
    });
  });

  test("auto", () => {
    expect(expandFlex("auto")).toEqual({
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: "auto"
    });
  });

  test("none", () => {
    expect(expandFlex("none")).toEqual({
      flexGrow: 0,
      flexShrink: 0,
      flexBasis: "auto"
    });
  });

  test("initial", () => {
    expect(expandFlex("initial")).toEqual({
      flexGrow: 0,
      flexShrink: 1,
      flexBasis: "auto"
    });
  });

  test("three values", () => {
    expect(expandFlex("1 1 auto")).toEqual({
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: "auto"
    });
    expect(expandFlex("0 0 200px")).toEqual({
      flexGrow: 0,
      flexShrink: 0,
      flexBasis: 200
    });
    expect(expandFlex("2 1 50%")).toEqual({
      flexGrow: 2,
      flexShrink: 1,
      flexBasis: "50%"
    });
  });

  test("two values", () => {
    expect(expandFlex("1 2")).toEqual({
      flexGrow: 1,
      flexShrink: 2,
      flexBasis: "0%"
    });
    expect(expandFlex("1 100px")).toEqual({
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 100
    });
  });

  test("a single basis", () => {
    expect(expandFlex("200px")).toEqual({
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 200
    });
  });

  test("an unknown value is left alone", () => {
    expect(expandFlex("calc(1 + 1)")).toBeUndefined();
  });

  test("convertDeclarations applies the expansion", () => {
    const { style } = convertDeclarations({ flex: 1 });
    expect(style).toMatchObject({
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: "0%"
    });
    expect(style.flex).toBeUndefined();
  });
});
