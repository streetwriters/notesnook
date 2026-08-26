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
import { Page, Paging } from "../../paging/index.js";
import { BlockId } from "../../block-id/block-id.js";
import { ImageNode } from "../../image/index.js";

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

  test("each node type calibrates from its own measurements", () => {
    const editor = createEditor(para("word ".repeat(50)) + listOf(20));
    const map = new HeightMap();
    const [paragraph, list] = blocks(editor);

    // the list renders far denser per unit of content than the prose does
    map.record(paragraph, 400);
    map.record(list, 100);

    // measured nodes report what they measured
    expect(map.heightFor(paragraph)).toBe(400);
    expect(map.heightFor(list)).toBe(100);

    // an unmeasured list of the same shape now follows the list's ratio, not
    // the paragraph's
    const other = list.type.create(null, list.content);
    expect(map.estimate(other)).toBeLessThan(map.estimate(paragraph));
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

  test("a measured height wins over any estimate", () => {
    const editor = createEditor(para("one") + para("two"));
    const map = new HeightMap();
    const [first] = blocks(editor);

    map.record(first, 999);
    expect(map.heightFor(first)).toBe(999);
    editor.destroy();
  });

  test("measurements mark the map for recalibration", () => {
    const editor = createEditor(para("word ".repeat(50)));
    const map = new HeightMap();
    const [paragraph] = blocks(editor);

    expect(map.needsRecalibration).toBe(false);
    map.record(paragraph, 800);
    expect(map.needsRecalibration).toBe(true);
    map.markRecalibrated();
    expect(map.needsRecalibration).toBe(false);
    editor.destroy();
  });
});
