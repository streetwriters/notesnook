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
import type { Editor } from "@tiptap/core";
import { q } from "../queries.js";
import { getQueryStore } from "../store.js";
import { toWireQuery } from "../remote-store.js";

// A caret at 5; every position maps to a box 10 wide, 20 tall, on its own row.
function fakeEditor(size = 30) {
  return {
    on() {},
    state: {
      selection: { from: 5, to: 5 },
      doc: { content: { size } }
    },
    view: {
      coordsAtPos: (pos: number) => ({
        left: pos * 10,
        right: pos * 10 + 10,
        top: pos * 20,
        bottom: pos * 20 + 20
      })
    }
  } as unknown as Editor;
}

describe("anchor query", () => {
  test("a range is measured from its document positions, not the selection", () => {
    const store = getQueryStore(fakeEditor());
    expect(store.read(q.anchor({ range: { from: 2, to: 4 } }))).toEqual({
      left: 20,
      right: 50,
      top: 40,
      bottom: 100
    });
  });

  test("a range outside the document is clamped to it", () => {
    const store = getQueryStore(fakeEditor(10));
    expect(store.read(q.anchor({ range: { from: -3, to: 99 } }))).toEqual({
      left: 0,
      right: 110,
      top: 0,
      bottom: 220
    });
  });

  test("the selection anchor still measures the caret", () => {
    const store = getQueryStore(fakeEditor());
    expect(store.read(q.anchor())).toEqual({
      left: 50,
      right: 60,
      top: 100,
      bottom: 120
    });
  });

  test("a range reaches the native editor as the caret anchor", () => {
    expect(toWireQuery(q.anchor({ range: { from: 1, to: 2 } })).args).toEqual(
      []
    );
    expect(toWireQuery(q.anchor({ node: "image" })).args).toEqual(["node"]);
  });
});
