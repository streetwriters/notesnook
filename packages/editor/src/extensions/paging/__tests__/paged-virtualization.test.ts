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
import { DecorationSet } from "@tiptap/pm/view";
import { Page, Paging, countPages } from "../index.js";
import { BlockId } from "../../block-id/block-id.js";
import { viewportKey } from "../index.js";

const PagedDocument = Node.create({
  name: "doc",
  topNode: true,
  content: "(page | block)+"
});

const BLOCKS = 1000;
const PAGE_SIZE = 100;

function savedNoteHTML(n: number) {
  let content = "";
  for (let i = 0; i < n; i++)
    content += `<p data-block-id="blk${i}">Paragraph number ${i}.</p>`;
  return content;
}

function createEditor() {
  return new Editor({
    extensions: [
      StarterKit.configure({ document: false }),
      PagedDocument,
      Page,
      BlockId,
      Paging.configure({
        enabled: true,
        pageSize: PAGE_SIZE,
        thresholdBlocks: 10
      })
    ],
    content: savedNoteHTML(BLOCKS)
  });
}

async function created() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function decorations(editor: Editor): DecorationSet {
  return viewportKey.getState(editor.state)?.decorations ?? DecorationSet.empty;
}

describe("paged virtualization", () => {
  test("renders pages, not blocks, as the top-level elements", async () => {
    const editor = createEditor();
    await created();

    expect(countPages(editor.state.doc)).toBe(10);
    expect(editor.view.dom.children).toHaveLength(10);
    editor.destroy();
  });

  test("keeps off-screen pages as placeholders", async () => {
    const editor = createEditor();
    await created();

    // pages 0 and 9 are edges and 0-1 hold the caret, so the rest are empty
    const placeholders = editor.view.dom.querySelectorAll(
      "[data-page-placeholder]"
    );
    expect(placeholders).toHaveLength(7);
    editor.destroy();
  });

  test("decorates pages rather than every block", async () => {
    const editor = createEditor();
    await created();

    const spans = decorations(editor).find(0, editor.state.doc.content.size);
    expect(spans).toHaveLength(3);
    editor.destroy();
  });

  test("a placeholder page keeps its blocks in the document", async () => {
    const editor = createEditor();
    await created();

    expect(
      editor.view.dom.querySelectorAll("[data-page-placeholder]").length
    ).toBeGreaterThan(0);
    const html = editor.getHTML();
    expect(html.match(/<p/g)).toHaveLength(BLOCKS);
    expect(html).not.toContain("data-page");
    editor.destroy();
  });

  test("a rendered page still carries its block id", async () => {
    const editor = createEditor();
    await created();

    const first = editor.view.dom.children[0] as HTMLElement;
    expect(first.hasAttribute("data-page-placeholder")).toBe(false);
    // Without this the viewport window loses sight of a page the moment it
    // renders, and it flips between rendered and blank on every frame.
    expect(first.getAttribute("data-block-id")).toBe(
      editor.state.doc.child(0).attrs.blockId
    );
    editor.destroy();
  });

  test("placeholder and rendered pages are tracked the same way", async () => {
    const editor = createEditor();
    await created();

    for (const element of Array.from(editor.view.dom.children))
      expect(element.getAttribute("data-block-id")).toBeTruthy();
    editor.destroy();
  });

  test("every page is rendered while the browser prints", async () => {
    const editor = createEditor();
    await created();
    expect(
      editor.view.dom.querySelectorAll("[data-page-placeholder]").length
    ).toBeGreaterThan(0);

    window.dispatchEvent(new Event("beforeprint"));

    expect(
      editor.view.dom.querySelectorAll("[data-page-placeholder]")
    ).toHaveLength(0);
    expect(editor.getText()).toContain(`Paragraph number ${BLOCKS - 1}.`);

    window.dispatchEvent(new Event("afterprint"));
    editor.destroy();
  });

  test("the page holding the caret is never a placeholder", async () => {
    const editor = createEditor();
    await created();

    editor.commands.setTextSelection(editor.state.doc.content.size - 2);
    const lastPage = editor.view.dom.children[9] as HTMLElement;
    expect(lastPage.hasAttribute("data-page-placeholder")).toBe(false);
    editor.destroy();
  });
});
