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
import { Node as ProsemirrorNode } from "@tiptap/pm/model";
import { HeightMap } from "../height-map.js";
import { Page, Paging } from "../index.js";
import { BlockId } from "../../block-id/block-id.js";
import { ImageNode } from "../../image/index.js";
import { Table } from "../../table/index.js";
import TableCell from "../../table-cell/index.js";
import TableHeader from "../../table-header/index.js";
import TableRow from "@tiptap/extension-table-row";

const PagedDocument = Node.create({
  name: "doc",
  topNode: true,
  content: "(page | block)+"
});

function createEditor(content: string, pageSize = 100) {
  return new Editor({
    extensions: [
      StarterKit.configure({ document: false }),
      ImageNode,
      Table,
      TableRow,
      TableCell,
      TableHeader,
      PagedDocument,
      Page,
      BlockId,
      Paging.configure({ enabled: true, pageSize, thresholdBlocks: 2 })
    ],
    content
  });
}

let ids = 0;
function id() {
  return `blk${ids++}`;
}

function listOf(items: number) {
  let html = `<ul data-block-id="${id()}">`;
  for (let i = 0; i < items; i++) html += `<li><p>Item ${i}</p></li>`;
  return html + "</ul>";
}

function para(text: string) {
  return `<p data-block-id="${id()}">${text}</p>`;
}

/** The document may or may not be paged, depending on how many blocks it has. */
function blocks(editor: Editor): ProsemirrorNode[] {
  const found: ProsemirrorNode[] = [];
  editor.state.doc.forEach((node) => {
    if (node.type.name === "page") node.forEach((block) => found.push(block));
    else found.push(node);
  });
  return found;
}

describe("height map", () => {
  test("a page is the sum of the blocks it holds", () => {
    const editor = createEditor(
      para("one") +
        listOf(20) +
        `<h1 data-block-id="${id()}">a heading</h1>` +
        para("text ".repeat(50)),
      4
    );
    const map = new HeightMap();
    const page = editor.state.doc.child(0);

    let sum = 0;
    page.forEach((child) => (sum += map.estimate(child)));
    expect(map.estimate(page)).toBe(sum);
    editor.destroy();
  });

  test("a table is estimated row by row", () => {
    const rows = (count: number) => {
      let html = `<table data-block-id="${id()}"><tbody>`;
      for (let i = 0; i < count; i++)
        html += `<tr><td><p>a</p></td><td><p>b</p></td></tr>`;
      return html + "</tbody></table>";
    };
    const editor = createEditor(rows(2) + rows(20));
    const map = new HeightMap();
    const tables = blocks(editor).filter((n) => n.type.name === "table");

    expect(tables).toHaveLength(2);
    const small = map.estimate(tables[0]);
    const big = map.estimate(tables[1]);
    expect(big).toBeGreaterThan(small * 3);
    expect(big).toBeLessThan(small * 15);
    editor.destroy();
  });

  test("an image is estimated from its stored height", () => {
    const editor = createEditor(
      `${para("one")}<img src="x.png" height="512" data-block-id="${id()}" />`
    );
    const map = new HeightMap();
    const image = blocks(editor).find((node) => node.type.name === "image");

    expect(image).toBeDefined();
    expect(Number(image?.attrs.height)).toBe(512);
    expect(map.estimate(image as ProsemirrorNode)).toBe(512);
    editor.destroy();
  });

  test("text is estimated from the lines it wraps to", () => {
    const editor = createEditor(para("word ".repeat(200)));
    const map = new HeightMap();
    const [paragraph] = blocks(editor);

    const wide = map.estimate(paragraph);
    map.setMetrics({ width: 300 });
    const narrow = map.estimate(paragraph);

    expect(narrow).toBeGreaterThan(wide);
    editor.destroy();
  });

  test("a measured height wins over any estimate", () => {
    const editor = createEditor(para("one") + para("two"));
    const map = new HeightMap();
    const [first] = blocks(editor);

    map.record(first, 999);
    expect(map.heightFor(first)).toBe(999);
    editor.destroy();
  });

  test("measuring something means placeholders need resizing", () => {
    const editor = createEditor(para("word ".repeat(50)));
    const map = new HeightMap();
    const [paragraph] = blocks(editor);

    expect(map.placeholdersNeedResizing).toBe(false);
    map.record(paragraph, 800);
    expect(map.placeholdersNeedResizing).toBe(true);
    map.markPlaceholdersResized();
    expect(map.placeholdersNeedResizing).toBe(false);
    editor.destroy();
  });
});
