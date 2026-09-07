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
import { createEditor } from "../../../test-utils/index.js";
import { BlockId } from "../../extensions/block-id/block-id.js";
import { Callout } from "../../extensions/callout/callout.js";
import { Heading } from "../../extensions/heading/heading.js";
import { getTableOfContents } from "../toc.js";

function tocOf(initialContent: string) {
  const { editor } = createEditor({
    extensions: {
      heading: Heading.configure({ levels: [1, 2, 3, 4, 5, 6] }),
      blockId: BlockId,
      callout: Callout
    },
    initialContent
  });
  return getTableOfContents(editor.state.doc, editor.view.dom);
}

describe("table of contents", () => {
  test("lists the note's headings, nested by level", () => {
    const toc = tocOf(`
      <h1 data-block-id="a">One</h1>
      <p>text</p>
      <h2 data-block-id="b">Two</h2>
      <h3 data-block-id="c">Three</h3>
      <h1 data-block-id="d">Another</h1>
    `);

    expect(toc.map((item) => [item.title, item.level])).toEqual([
      ["One", 0],
      ["Two", 1],
      ["Three", 2],
      ["Another", 0]
    ]);
    expect(toc.map((item) => item.id)).toEqual(["a", "b", "c", "d"]);
  });

  test("leaves out a heading with no block id to scroll to", () => {
    const toc = tocOf(`<h1>No id</h1><h2 data-block-id="b">Listed</h2>`);
    expect(toc.map((item) => item.title)).toEqual(["Listed"]);
  });

  test("reads headings the DOM is not showing", () => {
    const { editor } = createEditor({
      extensions: {
        heading: Heading.configure({ levels: [1, 2, 3] }),
        blockId: BlockId
      },
      initialContent: `<h1 data-block-id="a">Only heading</h1>`
    });
    // whatever is drawn, the document is what the contents are built from
    editor.view.dom.innerHTML = "";

    expect(
      getTableOfContents(editor.state.doc, editor.view.dom).map((i) => i.title)
    ).toEqual(["Only heading"]);
  });
});

describe("table of contents nesting", () => {
  test("a heading inside a quote is still listed", () => {
    const toc = tocOf(
      `<h1 data-block-id="a">Top</h1>
       <blockquote><h2 data-block-id="b">Quoted</h2></blockquote>`
    );
    expect(toc.map((item) => item.title)).toEqual(["Top", "Quoted"]);
  });

  test("a callout's own heading is left out", () => {
    const toc = tocOf(
      `<h1 data-block-id="a">Top</h1>
       <div class="callout" data-callout-type="info">
         <h2 data-block-id="b">Callout title</h2>
       </div>`
    );
    expect(toc.map((item) => item.title)).toEqual(["Top"]);
  });
});
