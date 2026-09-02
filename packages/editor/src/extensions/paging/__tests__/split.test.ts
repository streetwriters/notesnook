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
import {
  DEFAULT_PAGE_SIZE,
  countPages,
  flattenBlocks,
  flattenPages,
  isPage,
  toPages
} from "../split.js";

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
  test("splits the blocks into pages of the given size", () => {
    const editor = editorWith(paragraphs(250));
    const pages = toPages(editor.state.doc, editor.schema, 100);

    expect(pages.childCount).toBe(3);
    expect(pages.child(0).childCount).toBe(100);
    expect(pages.child(2).childCount).toBe(50);
    expect(isPage(pages.child(0))).toBe(true);
    editor.destroy();
  });

  test("keeps every block, in order", () => {
    const editor = editorWith(paragraphs(120));
    const paged = editor.schema.topNodeType.create(
      null,
      toPages(editor.state.doc, editor.schema, 50)
    );
    const blocks = flattenBlocks(paged);

    expect(blocks).toHaveLength(120);
    expect(blocks[0].textContent).toBe("Paragraph 0.");
    expect(blocks[119].textContent).toBe("Paragraph 119.");
    editor.destroy();
  });

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

  test("falls back to the default page size", () => {
    const editor = editorWith(paragraphs(DEFAULT_PAGE_SIZE * 2));
    const pages = toPages(editor.state.doc, editor.schema);

    expect(DEFAULT_PAGE_SIZE).toBe(50);
    expect(pages.childCount).toBe(2);
    editor.destroy();
  });

  test("leaves a document alone when the schema has no page node", () => {
    const editor = new Editor({
      extensions: [StarterKit],
      content: paragraphs(10)
    });
    const pages = toPages(editor.state.doc, editor.schema, 5);

    expect(pages).toBe(editor.state.doc.content);
    editor.destroy();
  });
});

describe("removing pages", () => {
  test("unwraps every page", () => {
    const editor = editorWith(paragraphs(60));
    const pages = toPages(editor.state.doc, editor.schema, 20);
    const flat = flattenPages(pages);

    expect(flat.childCount).toBe(60);
    flat.forEach((node) => expect(isPage(node)).toBe(false));
    editor.destroy();
  });

  test("returns unpaged content untouched", () => {
    const editor = editorWith(paragraphs(10));
    const content = editor.state.doc.content;

    expect(flattenPages(content)).toBe(content);
    editor.destroy();
  });
});
