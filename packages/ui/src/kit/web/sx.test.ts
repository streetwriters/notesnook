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
import { toThemeUISx } from "./sx";

describe("toThemeUISx", () => {
  it("returns an sx theme-ui already understands as the same object", () => {
    const sx = {
      bg: "background",
      p: 2,
      border: "1px solid",
      borderBottom: "1px solid var(--border)",
      lineHeight: 1.4,
      ":hover": { bg: "hover" },
      transition: "opacity 100ms ease"
    };
    expect(toThemeUISx(sx)).toBe(sx);
    expect(toThemeUISx(undefined)).toBe(undefined);
  });

  it("turns a colour token at the end of a border into its CSS variable", () => {
    expect(
      toThemeUISx({ border: "1px solid border", outline: "2px solid accent" })
    ).toEqual({
      border: "1px solid var(--border)",
      outline: "2px solid var(--accent)"
    });
    expect(toThemeUISx({ borderTop: "1px solid transparent" })).toEqual({
      borderTop: "1px solid transparent"
    });
    expect(toThemeUISx({ borderTop: "1px solid #ff0000" })).toEqual({
      borderTop: "1px solid #ff0000"
    });
  });

  it("writes the kit's transition, transform and line clamp as CSS", () => {
    expect(
      toThemeUISx({
        transition: {
          property: ["opacity", "backgroundColor"],
          duration: 100
        },
        transform: [{ translateX: 4 }, { rotate: "90deg" }, { scale: 2 }],
        lineClamp: 2,
        lineHeight: 20
      })
    ).toEqual({
      transition: "opacity 100ms ease 0ms, background-color 100ms ease 0ms",
      transform: "translateX(4px) rotate(90deg) scale(2)",
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
      whiteSpace: "normal",
      lineHeight: "20px"
    });
  });

  it("names an animation's keyframes once per distinct animation", () => {
    const spec = {
      keyframes: { from: { opacity: 0 }, to: { opacity: 1, bg: "accent" } },
      duration: 300,
      iterationCount: "infinite"
    };
    const run = (sx: Record<string, unknown>) =>
      toThemeUISx(sx) as { animation: string };
    const first = run({ animation: spec });
    const second = run({ animation: { ...spec } });
    // emotion's keyframes marker: it registers the frames and leaves the name
    expect(first.animation).toMatch(
      /^_EMO_(animation-\w+)_@keyframes \1\{from\{opacity:0;\}to\{opacity:1;background-color:var\(--accent\);\}\}_EMO_ 300ms ease 0ms infinite$/
    );
    expect(second.animation).toBe(first.animation);
  });

  it("maps group and drag-over states to selectors, also when nested", () => {
    expect(
      toThemeUISx({
        ":group-hover": { group: "row", style: { opacity: 1 } },
        ":drag-over": { border: "1px dashed accent" },
        ":hover": { transform: [{ scale: 1.1 }] },
        experimental_backgroundImage: "url(a.png)"
      })
    ).toEqual({
      ".nn-group-row:hover &": { opacity: 1 },
      "&[data-drag-over]": { border: "1px dashed var(--accent)" },
      ":hover": { transform: "scale(1.1)" },
      backgroundImage: "url(a.png)"
    });
  });
});
