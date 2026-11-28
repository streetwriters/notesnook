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
  alphaToken,
  resolveAlpha,
  resolveColor,
  resolveCssVars,
  resolveSx,
  withAlpha,
  withDisabledStyle
} from "./resolve";
import { registerStylesheet } from "../../shared/style/css-motion";

describe(":disabled", () => {
  test("applies while disabled and is dropped otherwise", () => {
    const sx = { bg: "accent", ":disabled": { bg: "background" } } as never;
    expect(withDisabledStyle(sx, true)).toEqual({ bg: "background" });
    expect(withDisabledStyle(sx, false)).toEqual({ bg: "accent" });
    const plain = { bg: "accent" } as never;
    expect(withDisabledStyle(plain, true)).toBe(plain);
  });
});

const colors = { accent: "#008837", background: "#fff" };

describe("CSS variables", () => {
  test("var(--token) is the token's colour, anywhere in a value", () => {
    expect(resolveColor("var(--accent)", colors)).toBe("#008837");
    expect(resolveCssVars("1px solid var(--background)", colors)).toBe(
      "1px solid #fff"
    );
    expect(resolveCssVars("var(--unknown)", colors)).toBe("var(--unknown)");
  });

  test("are replaced in an sx object, states included", () => {
    expect(
      resolveAlpha(
        {
          bg: "var(--accent)",
          border: "1px solid var(--background)",
          ":hover": { color: "var(--background)" }
        },
        colors
      )
    ).toEqual({
      bg: "#008837",
      border: "1px solid #fff",
      ":hover": { color: "#fff" }
    });
  });
});

describe("alpha", () => {
  test("a hex colour gets the opacity as its last two digits", () => {
    expect(withAlpha("#008837", 0.5)).toBe("#00883780");
    expect(withAlpha("#fff", 1)).toBe("#ffffffff");
    expect(withAlpha("#000", 0)).toBe("#00000000");
  });

  test("an existing opacity is multiplied, and the amount is clamped", () => {
    expect(withAlpha("#00000080", 0.5)).toBe("#00000040");
    expect(withAlpha("#123456", 4)).toBe("#123456ff");
    expect(withAlpha("#123456", -1)).toBe("#12345600");
  });

  test("a colour that is not hex is left as it is", () => {
    expect(withAlpha("transparent", 0.5)).toBe("transparent");
    expect(withAlpha("rgb(0, 0, 0)", 0.5)).toBe("rgb(0, 0, 0)");
  });

  test("a theme token is resolved when the style is drawn", () => {
    const token = alphaToken("accent", 0.7);
    expect(resolveColor(token, colors)).toBe("#008837b3");
    expect(resolveColor("accent", colors)).toBe("#008837");
    expect(resolveColor("#abcdef", colors)).toBe("#abcdef");
    expect(resolveColor(alphaToken("#ffffff", 0.2), colors)).toBe("#ffffff33");
    expect(resolveColor(alphaToken("red", 0.2), colors)).toBe("#ff000033");
  });

  test("alpha values are replaced anywhere in an sx object, states included", () => {
    const sx = {
      bg: alphaToken("accent", 0.5),
      color: "accent",
      width: 10,
      ":hover": { borderColor: alphaToken("background", 0.5) }
    };
    expect(resolveAlpha(sx, colors)).toEqual({
      bg: "#00883780",
      color: "accent",
      width: 10,
      ":hover": { borderColor: "#ffffff80" }
    });
  });

  test("an sx object without alpha values is returned untouched", () => {
    const sx = { color: "accent", ":hover": { color: "background" } };
    expect(resolveAlpha(sx, colors)).toBe(sx);
  });
});

describe("CSS variables", () => {
  test("a theme colour written as var(--name) is its colour", () => {
    expect(
      resolveAlpha({ color: "var(--accent)", bg: "var(--background)" }, colors)
    ).toEqual({ color: "#008837", bg: "#fff" });
  });

  test("nested state styles are resolved too, and unknown names are kept", () => {
    expect(
      resolveAlpha(
        { ":hover": { bg: "var(--accent)" }, color: "var(--nope)" },
        colors
      )
    ).toEqual({ ":hover": { bg: "#008837" }, color: "var(--nope)" });
  });
});

describe("theme callbacks", () => {
  test("are called with the theme, each with its own closure", () => {
    const context = {
      key: {},
      theme: { space: { spacing2: 5 } },
      colors: {}
    } as never;
    const at = (depth: number) =>
      resolveSx(
        { pl: (t) => (t.space as { spacing2: number }).spacing2 + depth * 10 },
        context,
        { breakpoint: 0 }
      );
    expect(JSON.stringify(at(1))).toContain("15");
    expect(JSON.stringify(at(2))).toContain("25");
  });
});

describe("CSS motion and theme-ui's forms in sx", () => {
  const context = {
    key: {},
    theme: { space: { spacing2: 5 }, breakpoints: [] },
    colors: { border: "#cccccc" }
  } as never;

  test("an animation string draws once its keyframes are registered", () => {
    const sx = { animation: "resolveTestFade 0.8s ease-out 0.4s both" };
    const before = resolveSx(sx as never, context, { breakpoint: 0 });
    expect(before.animated).toBeUndefined();
    expect(before.style).not.toHaveProperty("animationName");

    registerStylesheet(
      "@keyframes resolveTestFade { from { opacity: 0; } to { opacity: 1; } }"
    );
    const after = resolveSx(sx as never, context, { breakpoint: 0 });
    expect(after.animated).toBe(true);
    expect(after.style).toMatchObject({
      animationName: { from: { opacity: 0 }, to: { opacity: 1 } },
      animationDuration: "800ms",
      animationDelay: "400ms",
      animationFillMode: "both"
    });
  });

  test("a transition string of undrawable properties animates nothing", () => {
    const resolved = resolveSx(
      { transition: "width 0.2s", opacity: 1 } as never,
      context,
      { breakpoint: 0 }
    );
    expect(resolved.animated).toBeUndefined();
    expect(resolved.style).not.toHaveProperty("transition");
    expect(
      resolveSx({ transition: "opacity 0.2s" } as never, context, {
        breakpoint: 0
      }).style
    ).toMatchObject({ transitionProperty: ["opacity"] });
  });

  test("selectors are ignored and a gradient's var(--token) is its colour", () => {
    const { style } = resolveSx(
      {
        "& strong": { color: "accent" },
        "&::-webkit-scrollbar": { display: "none" },
        th: { fontWeight: "bold" },
        backgroundImage:
          "radial-gradient(circle, var(--border) 1px, transparent 1px)",
        scrollSnapType: "y mandatory"
      } as never,
      context,
      { breakpoint: 0 }
    );
    expect(style.experimental_backgroundImage).toBe(
      "radial-gradient(circle, #cccccc 1px, transparent 1px)"
    );
    expect(style).not.toHaveProperty("& strong");
    expect(style).not.toHaveProperty("th");
    expect(style).not.toHaveProperty("&::-webkit-scrollbar");
  });
});

describe("responsive display arrays (editor action bar tools)", () => {
  const context = {
    key: {},
    colors: {},
    theme: { breakpoints: ["480px", "1000px", "1000px"] }
  } as never;
  const tool = (hidden: boolean, hideOnMobile: boolean) => ({
    display: [hideOnMobile ? "none" : "flex", hidden ? "none" : "flex"]
  });

  test("a hidden tool is not drawn on a desktop-width window", () => {
    for (const breakpoint of [1, 2, 3])
      expect(
        resolveSx(tool(true, true) as never, context, { breakpoint }).style
          .display
      ).toBe("none");
  });

  test("a shown tool is drawn on desktop and hideOnMobile hides it when narrow", () => {
    expect(
      resolveSx(tool(false, true) as never, context, { breakpoint: 1 }).style
        .display
    ).not.toBe("none");
    expect(
      resolveSx(tool(false, true) as never, context, { breakpoint: 0 }).style
        .display
    ).toBe("none");
  });
});
