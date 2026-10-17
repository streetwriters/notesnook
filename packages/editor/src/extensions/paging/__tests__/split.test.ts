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
import { Page } from "../page.js";
import { countPages, flattenBlocks, toPages } from "../split.js";

const PagedDocument = Node.create({
  name: "doc",
  topNode: true,
  content: "(page | block)+"
});

function paragraphs(n: number) {
  let html = "";
  for (let i = 0; i < n; i++) html += `<p>Paragraph ${i}.</p>`;
  return html;
}

function editorWith(content: string) {
  return new Editor({
    extensions: [
      StarterKit.configure({ document: false }),
      PagedDocument,
      Page
    ],
    content
  });
}

describe("grouping blocks into pages", () => {
  test("re-pages from the blocks, not from the existing pages", () => {
    const editor = editorWith(paragraphs(100));
    const once = editor.schema.topNodeType.create(
      null,
      toPages(editor.state.doc, editor.schema, 25)
    );
    expect(countPages(once)).toBe(4);

    const twice = editor.schema.topNodeType.create(
      null,
      toPages(once, editor.schema, 50)
    );
    expect(countPages(twice)).toBe(2);
    expect(flattenBlocks(twice)).toHaveLength(100);
    editor.destroy();
  });
});
