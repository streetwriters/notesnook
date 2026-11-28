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
  convertAnimation,
  convertDeclarations,
  convertOutline,
  convertTransition,
  expandFlex
} from "./convert";
import { registerStylesheet } from "../../shared/style/css-motion";

describe("sx keys taken from apps/web", () => {
  test("pointerEvents all is auto; colorScheme is ignored", () => {
    expect(convertDeclarations({ pointerEvents: "all" }).style.pointerEvents).toBe(
      "auto"
    );
    expect(convertDeclarations({ colorScheme: "dark" }).style).not.toHaveProperty(
      "colorScheme"
    );
  });

  test("display block, fit-content and bolder draw as desktop defaults", () => {
    const { style } = convertDeclarations({
      display: "block",
      height: "fit-content",
      fontWeight: "bolder"
    });
    expect(style).not.toHaveProperty("display");
    expect(style).not.toHaveProperty("height");
    expect(style.fontWeight).toBe("700");
    expect(convertDeclarations({ border: 0 }).style.borderWidth).toBe(0);
  });

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

describe("logical alignment from apps/web", () => {
  test("start and end are flex-start and flex-end", () => {
    expect(
      convertDeclarations({
        alignItems: "start",
        alignSelf: "end",
        justifyContent: "end",
        alignContent: "start"
      }).style
    ).toMatchObject({
      alignItems: "flex-start",
      alignSelf: "flex-end",
      justifyContent: "flex-end",
      alignContent: "flex-start"
    });
  });

  test("textAlign start and end are left and right", () => {
    expect(convertDeclarations({ textAlign: "end" }).style.textAlign).toBe(
      "right"
    );
    expect(convertDeclarations({ textAlign: "start" }).style.textAlign).toBe(
      "left"
    );
  });

  test("a px radius is a number of pixels", () => {
    expect(convertDeclarations({ borderRadius: "150px" }).style.borderRadius).toBe(
      150
    );
  });
});

describe("CSS values apps/web writes that the contract now accepts", () => {
  test("rem and em are multiples of 16px", () => {
    const { style } = convertDeclarations({
      fontSize: "1.2rem",
      width: "10rem",
      marginTop: "0.5em",
      letterSpacing: ".5rem"
    });
    expect(style.fontSize).toBeCloseTo(19.2);
    expect(style.width).toBe(160);
    expect(style.marginTop).toBe(8);
    expect(style.letterSpacing).toBe(8);
  });

  test("fixed is absolute, sticky is relative, static is the default", () => {
    expect(convertDeclarations({ position: "fixed" }).style.position).toBe(
      "absolute"
    );
    expect(convertDeclarations({ position: "sticky" }).style.position).toBe(
      "relative"
    );
    expect(convertDeclarations({ position: "static" }).style).not.toHaveProperty(
      "position"
    );
    expect(convertDeclarations({ position: "absolute" }).style.position).toBe(
      "absolute"
    );
  });

  test("a gradient background is drawn, with its size and position", () => {
    const { style } = convertDeclarations({
      backgroundImage: "radial-gradient(circle, #ccc 1px, transparent 1px)",
      backgroundSize: "20px 20px",
      backgroundPosition: "center"
    });
    expect(style).toMatchObject({
      experimental_backgroundImage:
        "radial-gradient(circle, #ccc 1px, transparent 1px)",
      experimental_backgroundSize: "20px 20px",
      experimental_backgroundPosition: "center"
    });
    expect(style).not.toHaveProperty("backgroundImage");
    expect(
      convertDeclarations({
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      }).style
    ).toMatchObject({
      experimental_backgroundImage:
        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    });
  });

  test("a background with no gradient is a colour; none and url() draw nothing", () => {
    expect(convertDeclarations({ background: "#ff0000" }).style.backgroundColor).toBe(
      "#ff0000"
    );
    for (const value of ["none", "url(a.png)"]) {
      const { style } = convertDeclarations({
        background: value,
        backgroundImage: value
      });
      expect(style).not.toHaveProperty("backgroundColor");
      expect(style).not.toHaveProperty("experimental_backgroundImage");
    }
    expect(convertDeclarations({ backgroundSize: "auto" }).style).not.toHaveProperty(
      "experimental_backgroundSize"
    );
  });

  test("!important is dropped from the value", () => {
    expect(
      convertDeclarations({ width: "100px !important", color: "red!important" })
        .style
    ).toMatchObject({ width: 100, color: "red" });
  });

  test("values with no desktop layout leave the property unset", () => {
    const { style } = convertDeclarations({
      width: "calc(100% - 20px)",
      maxWidth: "min(30%, 400px)",
      height: "min-content",
      color: "currentColor",
      minHeight: "unset",
      opacity: 0.5
    });
    expect(style).toEqual({ opacity: 0.5, flexShrink: 1 });
  });

  test("inline-flex lays out as a row, grid as the default column", () => {
    expect(convertDeclarations({ display: "inline-flex" }).style.flexDirection).toBe(
      "row"
    );
    const grid = convertDeclarations({
      display: "grid",
      gridTemplateColumns: "1fr 1fr"
    }).style;
    expect(grid).not.toHaveProperty("display");
    expect(grid).not.toHaveProperty("flexDirection");
  });
});

describe("CSS motion strings", () => {
  test("a transition string is the properties desktop animates", () => {
    expect(convertTransition("opacity 0.2s ease-in-out")).toEqual({
      transitionProperty: ["opacity"],
      transitionDuration: "200ms",
      transitionDelay: "0ms",
      transitionTimingFunction: "ease-in-out"
    });
    expect(convertTransition("width 1s")).toBeUndefined();
  });

  test("an animation string draws registered keyframes, with its fill mode", () => {
    registerStylesheet(
      "@keyframes convertTestSlide { from { opacity: 0; transform: translateY(30px); width: 10px; } to { opacity: 1; transform: translateY(0); } }"
    );
    expect(
      convertAnimation("convertTestSlide 1s ease-out 0.2s both", (frame) => frame)
    ).toEqual({
      // Only what desktop animates is kept from a frame (no width).
      animationName: {
        from: { opacity: 0, transform: "translateY(30px)" },
        to: { opacity: 1, transform: "translateY(0)" }
      },
      animationDuration: "1000ms",
      animationDelay: "200ms",
      animationIterationCount: 1,
      animationTimingFunction: "ease-out",
      animationFillMode: "both"
    });
    expect(
      convertAnimation("notRegistered 1s", (frame) => frame)
    ).toBeUndefined();
  });
});
