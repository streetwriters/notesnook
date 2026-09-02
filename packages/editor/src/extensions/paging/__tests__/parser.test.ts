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
import { DOMParser } from "@tiptap/pm/model";
import StarterKit from "@tiptap/starter-kit";
import { Page } from "../page.js";
import { installPagingParser } from "../parser.js";
import { countPages, flattenBlocks, isPage } from "../split.js";

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

function schemaWithParser(pageSize = 20, thresholdBlocks = 10) {
  const editor = new Editor({
    extensions: [StarterKit.configure({ document: false }), PagedDocument, Page]
  });
  installPagingParser(editor.schema, { pageSize, thresholdBlocks });
  return editor;
}

function html(content: string) {
  const dom = document.createElement("div");
  dom.innerHTML = content;
  return dom;
}

describe("paging while parsing", () => {
  test("pages a document past the threshold", () => {
    const editor = schemaWithParser();
    const doc = DOMParser.fromSchema(editor.schema).parse(html(paragraphs(60)));

    expect(countPages(doc)).toBe(3);
    expect(doc.childCount).toBe(3);
    expect(flattenBlocks(doc)).toHaveLength(60);
    editor.destroy();
  });

  test("leaves a document at the threshold flat", () => {
    const editor = schemaWithParser(20, 10);
    const doc = DOMParser.fromSchema(editor.schema).parse(html(paragraphs(10)));

    expect(countPages(doc)).toBe(0);
    expect(doc.childCount).toBe(10);
    editor.destroy();
  });

  test("pasted content does not become a page of its own", () => {
    const editor = schemaWithParser();
    const slice = DOMParser.fromSchema(editor.schema).parseSlice(
      html(paragraphs(60))
    );

    let pages = 0;
    slice.content.forEach((node) => {
      if (isPage(node)) pages++;
    });
    expect(pages).toBe(0);
    expect(slice.content.childCount).toBe(60);
    editor.destroy();
  });

  test("installing again updates the options in place", () => {
    const editor = schemaWithParser(20, 10);
    const parser = DOMParser.fromSchema(editor.schema);
    installPagingParser(editor.schema, { pageSize: 30, thresholdBlocks: 10 });

    expect(DOMParser.fromSchema(editor.schema)).toBe(parser);
    expect(countPages(parser.parse(html(paragraphs(60))))).toBe(2);
    editor.destroy();
  });
});
