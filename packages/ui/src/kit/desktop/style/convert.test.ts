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
import { convertDeclarations, convertOutline, expandFlex } from "./convert";

describe("sx keys taken from apps/web", () => {
  test("inherit leaves the property to the parent", () => {
    expect(convertDeclarations({ color: "inherit" }).style.color).toBe(
      undefined
    );
  });

  test("start and end alignment are flex-start and flex-end", () => {
    expect(
      convertDeclarations({
        alignSelf: "start",
        alignItems: "end",
        justifyContent: "start",
        alignContent: "end"
      }).style
    ).toMatchObject({
      alignSelf: "flex-start",
      alignItems: "flex-end",
      justifyContent: "flex-start",
      alignContent: "flex-end"
    });
    expect(convertDeclarations({ alignItems: "center" }).style.alignItems).toBe(
      "center"
    );
  });

  test("overflowX/overflowY set overflow; auto scrolls", () => {
    expect(convertDeclarations({ overflowY: "auto" }).style.overflow).toBe(
      "scroll"
    );
    expect(convertDeclarations({ overflowX: "hidden" }).style.overflow).toBe(
      "hidden"
    );
  });

  test("inset sets every side", () => {
    const { style } = convertDeclarations({ inset: 0 });
    expect(style).toMatchObject({ top: 0, right: 0, bottom: 0, left: 0 });
    expect(convertDeclarations({ inset: "4px" }).style.left).toBe(4);
  });

  test("size sets width and height", () => {
    expect(convertDeclarations({ size: "20px" }).style).toMatchObject({
      width: 20,
      height: 20
    });
  });

  test("textDecoration becomes textDecorationLine", () => {
    expect(convertDeclarations({ textDecoration: "underline" }).style).toEqual(
      expect.objectContaining({ textDecorationLine: "underline" })
    );
  });

  test("visibility hidden draws nothing and takes no pointer events", () => {
    const { style } = convertDeclarations({ visibility: "hidden" });
    expect(style).toMatchObject({ opacity: 0, pointerEvents: "none" });
    expect(
      convertDeclarations({ visibility: "visible" }).style.opacity
    ).toBeUndefined();
  });

  test("overflowWrap and wordWrap are dropped", () => {
    const { style } = convertDeclarations({
      overflowWrap: "anywhere",
      wordWrap: "break-word"
    });
    expect(style.overflowWrap).toBeUndefined();
    expect(style.wordWrap).toBeUndefined();
  });

  test("border side widths pass through, each side on its own", () => {
    expect(
      convertDeclarations({
        borderTopWidth: 1,
        borderRightWidth: 2,
        borderBottomWidth: 3,
        borderLeftWidth: 4
      }).style
    ).toMatchObject({
      borderTopWidth: 1,
      borderRightWidth: 2,
      borderBottomWidth: 3,
      borderLeftWidth: 4
    });
  });

  test("borderStyle passes through", () => {
    expect(convertDeclarations({ borderStyle: "dashed" }).style).toMatchObject({
      borderStyle: "dashed"
    });
  });

  test("textDecorationColor passes through", () => {
    expect(
      convertDeclarations({ textDecorationColor: "red" }).style
    ).toMatchObject({ textDecorationColor: "red" });
  });

  test("background is a colour; gradients and images are not drawn", () => {
    expect(convertDeclarations({ background: "red" }).style).toMatchObject({
      backgroundColor: "red"
    });
    expect(
      convertDeclarations({ background: "linear-gradient(red, blue)" }).style
        .backgroundColor
    ).toBeUndefined();
    expect(
      convertDeclarations({ background: "url(a.png)" }).style.backgroundColor
    ).toBeUndefined();
  });

  test("outline is none, or width, style and colour together", () => {
    expect(convertDeclarations({ outline: "none" }).style).toMatchObject({
      outlineWidth: 0
    });
    expect(
      convertDeclarations({ outline: "2px solid var(--accent)" }).style
    ).toMatchObject({ outlineWidth: 2, outlineColor: "accent" });
    expect(
      convertDeclarations({ outline: "2px solid" }).style.outlineWidth
    ).toBeUndefined();
  });
});

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

describe("outline shorthand", () => {
  test("width, style and a theme variable become outline props", () => {
    expect(convertOutline("2px solid var(--accent)")).toEqual([
      ["outlineWidth", 2],
      ["outlineColor", "accent"],
      ["outlineOffset", 0]
    ]);
  });

  test("none removes the outline", () => {
    expect(convertOutline("none")).toEqual([["outlineWidth", 0]]);
    expect(convertOutline("1.5px none")).toEqual([["outlineWidth", 0]]);
  });

  test("a literal colour is kept", () => {
    expect(convertOutline("1px solid #ff0000")).toEqual([
      ["outlineWidth", 1],
      ["outlineColor", "#ff0000"],
      ["outlineOffset", 0]
    ]);
  });
});

describe("styles that replace React Native props", () => {
  test("lineClamp becomes the number of lines and is not a style", () => {
    const converted = convertDeclarations({ lineClamp: 2 });
    expect(converted.numberOfLines).toBe(2);
    expect(converted.style).not.toHaveProperty("lineClamp");
  });

  test("lineClamp wins over an ellipsis, and nowrap is always one line", () => {
    expect(
      convertDeclarations({ lineClamp: 3, textOverflow: "ellipsis" })
        .numberOfLines
    ).toBe(3);
    expect(
      convertDeclarations({ textOverflow: "ellipsis" }).numberOfLines
    ).toBe(1);
    expect(
      convertDeclarations({ lineClamp: 3, whiteSpace: "nowrap" }).numberOfLines
    ).toBe(1);
  });

  test("a lineClamp that is not a positive number is ignored", () => {
    expect(convertDeclarations({ lineClamp: 0 }).numberOfLines).toBeUndefined();
    expect(
      convertDeclarations({ lineClamp: "none" }).numberOfLines
    ).toBeUndefined();
  });

  test("objectFit is handed to the image and is not a style", () => {
    const converted = convertDeclarations({ objectFit: "cover", width: 10 });
    expect(converted.objectFit).toBe("cover");
    expect(converted.style).not.toHaveProperty("objectFit");
    expect(converted.style.width).toBe(10);
  });
});
