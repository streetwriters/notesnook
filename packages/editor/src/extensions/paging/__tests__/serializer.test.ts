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
import { Editor, Node, getHTMLFromFragment } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Page } from "../page.js";
import { installFlatteningSerializer } from "../serializer.js";
import { toPages } from "../split.js";
import { ClipboardDOMSerializer } from "../../clipboard/clipboard-dom-serializer.js";

const PagedDocument = Node.create({
  name: "doc",
  topNode: true,
  content: "(page | block)+"
});

const BLOCKS = 60;

function paragraphs(n: number) {
  let html = "";
  for (let i = 0; i < n; i++) html += `<p>Paragraph ${i}.</p>`;
  return html;
}

function pagedEditor() {
  const editor = new Editor({
    extensions: [
      StarterKit.configure({ document: false }),
      PagedDocument,
      Page
    ],
    content: paragraphs(BLOCKS)
  });
  installFlatteningSerializer(editor.schema);
  editor.view.dispatch(
    editor.state.tr.replaceWith(
      0,
      editor.state.doc.content.size,
      toPages(editor.state.doc, editor.schema, 20)
    )
  );
  return editor;
}

describe("serializing a paged document", () => {
  test("getHTMLFromFragment strips pages too", () => {
    const editor = pagedEditor();

    const html = getHTMLFromFragment(editor.state.doc.content, editor.schema);
    expect(html).not.toContain("data-page");
    expect(html.match(/<p/g)).toHaveLength(BLOCKS);
    editor.destroy();
  });

  test("copying across pages puts plain content on the clipboard", () => {
    const editor = pagedEditor();
    editor.commands.selectAll();

    const container = document.createElement("div");
    container.appendChild(
      ClipboardDOMSerializer.fromSchema(editor.schema).serializeFragment(
        editor.state.selection.content().content
      )
    );

    expect(container.innerHTML).not.toContain("data-page");
    expect(container.innerHTML.match(/<p/g)).toHaveLength(BLOCKS);
    editor.destroy();
  });
});
