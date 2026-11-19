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
import { createStorageKV } from "./storage";

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
