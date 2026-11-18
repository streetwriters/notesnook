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
import { lineHeightRatio } from "./style/line-height";
import { mergeShorthands } from "./style/shorthand";
import { normalizeVariant } from "./style/variants";
import { createStorageKV } from "./storage";

describe("lineHeightRatio", () => {
  it("reads percentages and small numbers as ratios", () => {
    expect(lineHeightRatio("150%")).toBe(1.5);
    expect(lineHeightRatio(1.4)).toBe(1.4);
  });

  it("treats large numbers and other values as absolute", () => {
    expect(lineHeightRatio(20)).toBeUndefined();
    expect(lineHeightRatio("20px")).toBeUndefined();
    expect(lineHeightRatio(undefined)).toBeUndefined();
  });
});

describe("mergeShorthands", () => {
  it("returns sx untouched when nothing to merge", () => {
    const sx = { color: "red" };
    expect(mergeShorthands({ sx } as never)).toBe(sx);
  });

  it("lets sx win over props and props win over defaults", () => {
    const merged = mergeShorthands(
      { p: 1, m: 2, sx: { m: 3 } } as never,
      { p: 9, gap: 4 } as never
    );
    expect(merged).toEqual({ p: 1, m: 3, gap: 4 });
  });
});

describe("normalizeVariant", () => {
  it("resolves css variables and maps state selectors", () => {
    const result = normalizeVariant(
      {
        color: "var(--accent)",
        "&:hover": { bg: "var(--hover)" },
        "::placeholder": { color: "red" }
      },
      { accent: "#f00", hover: "#0f0" }
    );
    expect(result).toEqual({
      color: "#f00",
      ":hover": { bg: "#0f0" }
    });
  });

  it("keeps the variant key so theme-ui can chain it", () => {
    expect(normalizeVariant({ variant: "forms.input" }, {})).toEqual({
      variant: "forms.input"
    });
  });
});

describe("createStorageKV", () => {
  it("round-trips values through a sync kv", async () => {
    const map = new Map<string, unknown>();
    const kv = createStorageKV({
      get: (key) => map.get(key) as never,
      set: (key, value) => void map.set(key, value),
      delete: (key) => void map.delete(key),
      keys: () => [...map.keys()]
    });
    await kv.write("b", 2);
    await kv.write("a", 1);
    expect(await kv.read("a")).toBe(1);
    expect(await kv.readMulti(["b", "a"])).toEqual([
      ["a", 1],
      ["b", 2]
    ]);
    await kv.remove("a");
    expect(await kv.getAllKeys()).toEqual(["b"]);
    await kv.clear();
    expect(await kv.getAllKeys()).toEqual([]);
  });
});
