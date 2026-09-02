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

import { describe, expect, test, vi } from "vitest";
import { Editor, Node } from "@tiptap/core";
import { DOMSerializer } from "@tiptap/pm/model";
import StarterKit from "@tiptap/starter-kit";
import { Page, Paging, countPages, serializeDocumentHTML } from "../index.js";

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

describe("serialization cache", () => {
  test("matches the plain serializer exactly", async () => {
    const editor = createEditor(savedNoteHTML(BLOCKS));
    await created();
    expect(countPages(editor.state.doc)).toBe(3);

    expect(serializeDocumentHTML(editor.state.doc, editor.schema)).toBe(
      editor.getHTML()
    );
    editor.destroy();
  });

  test("re-serializes only the page that was edited", async () => {
    const editor = createEditor(savedNoteHTML(BLOCKS));
    await created();
    serializeDocumentHTML(editor.state.doc, editor.schema);

    const serializer = DOMSerializer.fromSchema(editor.schema);
    const serializeFragment = vi.spyOn(serializer, "serializeFragment");
    editor.commands.setTextSelection(3);
    editor.commands.insertContent("edited ");
    serializeDocumentHTML(editor.state.doc, editor.schema);

    // serializeFragment recurses into the fragment it is given, so only the
    // calls made with a whole page say how many pages were serialized.
    const pages = new Set<unknown>();
    editor.state.doc.forEach((page) => pages.add(page.content));
    const serializedPages = serializeFragment.mock.calls.filter(([fragment]) =>
      pages.has(fragment)
    );

    expect(pages.size).toBe(3);
    expect(serializedPages).toHaveLength(1);
    serializeFragment.mockRestore();
    editor.destroy();
  });

  test("still reflects the edit", async () => {
    const editor = createEditor(savedNoteHTML(BLOCKS));
    await created();
    serializeDocumentHTML(editor.state.doc, editor.schema);

    editor.commands.setTextSelection(3);
    editor.commands.insertContent("edited ");

    const html = serializeDocumentHTML(editor.state.doc, editor.schema);
    expect(html).toContain("edited");
    expect(html).toBe(editor.getHTML());
    expect(html.match(/<p/g)).toHaveLength(BLOCKS);
    editor.destroy();
  });

  test("works without pages too", async () => {
    const editor = createEditor(savedNoteHTML(20), false);
    await created();
    expect(countPages(editor.state.doc)).toBe(0);

    expect(serializeDocumentHTML(editor.state.doc, editor.schema)).toBe(
      editor.getHTML()
    );
    editor.destroy();
  });
});
