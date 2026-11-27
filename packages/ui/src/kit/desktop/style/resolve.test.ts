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
  withAlpha
} from "./resolve";

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
