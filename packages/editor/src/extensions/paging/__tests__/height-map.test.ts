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
  test("a longer paragraph is estimated taller than a short one", () => {
    const editor = createEditor(
      para("short") + para("a longer paragraph ".repeat(40))
    );
    const map = new HeightMap();
    const [short, long] = blocks(editor);

    expect(map.estimate(long)).toBeGreaterThan(map.estimate(short));
    editor.destroy();
  });

  test("a list is estimated from the items it contains", () => {
    const editor = createEditor(`${listOf(3)}${listOf(200)}`);
    const map = new HeightMap();
    const [small, big] = blocks(editor);

    expect(small.type.name).toBe("bulletList");
    expect(map.estimate(big)).toBeGreaterThan(map.estimate(small) * 3);
    editor.destroy();
  });

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

  test("text types calibrate from their own measurements", () => {
    const editor = createEditor(
      para("word ".repeat(50)) + para("word ".repeat(50))
    );
    const map = new HeightMap();
    const [measured, other] = blocks(editor);

    map.record(measured, 400);

    expect(map.heightFor(measured)).toBe(400);
    // an identical paragraph that was never measured now follows that ratio
    expect(map.estimate(other)).toBeGreaterThan(300);
    expect(map.estimate(other)).toBeLessThanOrEqual(420);
    editor.destroy();
  });

  test("a list is measured by its items, not by prose density", () => {
    const editor = createEditor(para("word ".repeat(50)) + listOf(20));
    const map = new HeightMap();
    const [paragraph, list] = blocks(editor);

    // calibrating prose to something extreme must not move the list, which is
    // estimated from the items it holds
    const before = map.estimate(list);
    map.record(paragraph, 4000);

    expect(map.estimate(list)).toBe(before);
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
    // ten times the rows, and the cells of a row sit side by side
    expect(big).toBeGreaterThan(small * 3);
    expect(big).toBeLessThan(small * 15);
    editor.destroy();
  });

  test("an image too wide for the editor is scaled down", () => {
    const editor = createEditor(
      `${para(
        "one"
      )}<img src="x.png" width="1000" height="500" data-block-id="${id()}" />`
    );
    const map = new HeightMap();
    const image = blocks(editor).find(
      (node) => node.type.name === "image"
    ) as ProsemirrorNode;

    // the editor defaults to an 850px measure, so a 1000px image already
    // scales; a narrower one scales further
    expect(map.estimate(image)).toBe(425);
    map.setMetrics({ width: 500 });
    expect(map.estimate(image)).toBe(250);
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
    // no guessing needed: the note already knows how tall the image is
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

    // the same text in a narrower measure wraps to more lines
    expect(narrow).toBeGreaterThan(wide);
    editor.destroy();
  });

  test("a heading is estimated at its own size", () => {
    const text = "a fairly long heading that will wrap ".repeat(4);
    const editor = createEditor(
      para(text) + `<h1 data-block-id="${id()}">${text}</h1>`
    );
    const map = new HeightMap();
    const [paragraph, heading] = blocks(editor);

    expect(heading.type.name).toBe("heading");
    expect(map.estimate(heading)).toBeGreaterThan(map.estimate(paragraph));
    editor.destroy();
  });

  test("a new layout means placeholders need resizing", () => {
    const map = new HeightMap();
    expect(map.placeholdersNeedResizing).toBe(false);
    map.setMetrics({ width: 400 });
    expect(map.placeholdersNeedResizing).toBe(true);
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
