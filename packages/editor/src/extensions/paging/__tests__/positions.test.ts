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
import { Editor, Node } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import {
  Page,
  Paging,
  countPages,
  fromFlatPosition,
  toFlatPosition
} from "../index.js";

const PagedDocument = Node.create({
  name: "doc",
  topNode: true,
  content: "(page | block)+"
});

const BLOCKS = 250;
const PAGE_SIZE = 100;

function savedNoteHTML(n: number) {
  let content = "";
  for (let i = 0; i < n; i++)
    content += `<p data-block-id="blk${i}">Paragraph number ${i}.</p>`;
  return content;
}

function createEditor(content: string, enabled = true) {
  return new Editor({
    extensions: [
      StarterKit.configure({ document: false }),
      PagedDocument,
      Page,
      Paging.configure({ enabled, pageSize: PAGE_SIZE, thresholdBlocks: 10 })
    ],
    content
  });
}

async function created() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("paging positions", () => {
  test("flat positions round-trip through a paged document", async () => {
    const editor = createEditor(savedNoteHTML(BLOCKS));
    await created();
    expect(countPages(editor.state.doc)).toBe(3);

    // Positions on a page boundary are ambiguous by nature -- the gap between
    // two pages is a single position once the pages are gone. Carets only ever
    // sit inside a textblock, and those must survive exactly.
    const doc = editor.state.doc;
    let checked = 0;
    for (let pos = 1; pos < doc.content.size; pos++) {
      if (!doc.resolve(pos).parent.isTextblock) continue;
      const flat = toFlatPosition(doc, pos);
      expect(fromFlatPosition(doc, flat)).toBe(pos);
      checked++;
    }
    expect(checked).toBeGreaterThan(1000);
    editor.destroy();
  });

  test("a position saved unpaged resolves to the same block when paged", async () => {
    const flatEditor = createEditor(savedNoteHTML(BLOCKS), false);
    await created();
    expect(countPages(flatEditor.state.doc)).toBe(0);

    let target = 0;
    for (let i = 0; i < 120; i++)
      target += flatEditor.state.doc.child(i).nodeSize;
    target += 3;
    const saved = toFlatPosition(flatEditor.state.doc, target);
    expect(saved).toBe(target);
    const text = flatEditor.state.doc.child(120).textContent;
    flatEditor.destroy();

    const pagedEditor = createEditor(savedNoteHTML(BLOCKS));
    await created();
    const restored = fromFlatPosition(pagedEditor.state.doc, saved);
    expect(pagedEditor.state.doc.resolve(restored).parent.textContent).toBe(
      text
    );
    pagedEditor.destroy();
  });

  test("conversions are the identity without pages", async () => {
    const editor = createEditor(savedNoteHTML(20), false);
    await created();

    const doc = editor.state.doc;
    for (let pos = 0; pos <= doc.content.size; pos += 5) {
      expect(toFlatPosition(doc, pos)).toBe(pos);
      expect(fromFlatPosition(doc, pos)).toBe(pos);
    }
    editor.destroy();
  });
});
