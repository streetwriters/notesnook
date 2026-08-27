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
import { Editor, getHTMLFromFragment } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Node } from "@tiptap/core";
import {
  DEFAULT_PAGE_SIZE,
  Page,
  Paging,
  countPages,
  flattenBlocks,
  fromFlatPosition,
  serializeDocumentHTML,
  toFlatPosition
} from "../index.js";
import { BlockId } from "../../block-id/block-id.js";
import { getTableOfContents } from "../../../utils/toc.js";
import { ClipboardDOMSerializer } from "../../clipboard/clipboard-dom-serializer.js";
import { profiler } from "../../../utils/profiler.js";

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

function createEditor(content: string, enabled = true, blocks = 10) {
  return new Editor({
    extensions: [
      StarterKit.configure({ document: false }),
      PagedDocument,
      Page,
      BlockId,
      Paging.configure({
        enabled,
        pageSize: PAGE_SIZE,
        thresholdBlocks: blocks
      })
    ],
    content
  });
}

async function created() {
  // Tiptap emits `create` from a timeout in the constructor.
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("paging positions", () => {
  test("flat positions round-trip through a paged document", async () => {
    const editor = createEditor(savedNoteHTML(BLOCKS));
    await created();
    expect(countPages(editor.state.doc)).toBe(3);

    // Positions on a page boundary are ambiguous by nature -- the gap between
    // two pages is a single position once the pages are gone. Carets only ever
    // sit inside a textblock, and those must survive exactly.
    const doc = editor.state.doc;
    let checked = 0;
    for (let pos = 1; pos < doc.content.size; pos++) {
      if (!doc.resolve(pos).parent.isTextblock) continue;
      const flat = toFlatPosition(doc, pos);
      expect(fromFlatPosition(doc, flat)).toBe(pos);
      checked++;
    }
    expect(checked).toBeGreaterThan(1000);
    editor.destroy();
  });

  test("a position saved unpaged resolves to the same block when paged", async () => {
    const flatEditor = createEditor(savedNoteHTML(BLOCKS), false);
    await created();
    expect(countPages(flatEditor.state.doc)).toBe(0);

    // caret inside block 120 of the unpaged document
    let target = 0;
    for (let i = 0; i < 120; i++)
      target += flatEditor.state.doc.child(i).nodeSize;
    target += 3;
    const saved = toFlatPosition(flatEditor.state.doc, target);
    expect(saved).toBe(target);
    const text = flatEditor.state.doc.child(120).textContent;
    flatEditor.destroy();

    const pagedEditor = createEditor(savedNoteHTML(BLOCKS));
    await created();
    const restored = fromFlatPosition(pagedEditor.state.doc, saved);
    expect(pagedEditor.state.doc.resolve(restored).parent.textContent).toBe(
      text
    );
    pagedEditor.destroy();
  });

  test("conversions are the identity without pages", async () => {
    const editor = createEditor(savedNoteHTML(20), false);
    await created();

    const doc = editor.state.doc;
    for (let pos = 0; pos <= doc.content.size; pos += 5) {
      expect(toFlatPosition(doc, pos)).toBe(pos);
      expect(fromFlatPosition(doc, pos)).toBe(pos);
    }
    editor.destroy();
  });
});

describe("paging", () => {
  test("groups blocks into pages once the note is opened", async () => {
    const editor = createEditor(savedNoteHTML(BLOCKS));
    await created();

    expect(countPages(editor.state.doc)).toBe(3);
    expect(editor.state.doc.childCount).toBe(3);
    expect(editor.state.doc.child(0).childCount).toBe(PAGE_SIZE);
    expect(editor.state.doc.child(2).childCount).toBe(50);
    editor.destroy();
  });

  test("pages exist before the first render, not after it", () => {
    const editor = createEditor(savedNoteHTML(BLOCKS));

    // no `await created()`: the parser pages the document, so the very first
    // view already renders pages instead of 250 blocks.
    expect(countPages(editor.state.doc)).toBe(3);
    expect(editor.view.dom.children).toHaveLength(3);
    editor.destroy();
  });

  test("keeps every block, in order", async () => {
    const editor = createEditor(savedNoteHTML(BLOCKS));
    await created();

    const blocks = flattenBlocks(editor.state.doc);
    expect(blocks).toHaveLength(BLOCKS);
    expect(blocks[0].textContent).toBe("Paragraph number 0.");
    expect(blocks[BLOCKS - 1].textContent).toBe(
      `Paragraph number ${BLOCKS - 1}.`
    );
    editor.destroy();
  });

  test("serializes back to the stored, page-free HTML", async () => {
    const html = savedNoteHTML(BLOCKS);
    const editor = createEditor(html);
    const before = editor.getHTML();
    await created();

    expect(countPages(editor.state.doc)).toBe(3);
    const after = editor.getHTML();
    expect(after).not.toContain("data-page");
    expect(after).toBe(before);
    editor.destroy();
  });

  test("getHTMLFromFragment also strips pages", async () => {
    const editor = createEditor(savedNoteHTML(BLOCKS));
    await created();

    const html = getHTMLFromFragment(editor.state.doc.content, editor.schema);
    expect(html).not.toContain("data-page");
    expect(html.match(/<p/g)).toHaveLength(BLOCKS);
    editor.destroy();
  });

  test("copying across pages puts plain content on the clipboard", async () => {
    const editor = createEditor(savedNoteHTML(BLOCKS));
    await created();
    expect(countPages(editor.state.doc)).toBe(3);

    editor.commands.selectAll();
    const container = document.createElement("div");
    container.appendChild(
      ClipboardDOMSerializer.fromSchema(editor.schema).serializeFragment(
        editor.state.selection.content().content
      )
    );

    // the clipboard has its own serializer, which has to strip pages as well
    expect(container.innerHTML).not.toContain("data-page");
    expect(container.innerHTML.match(/<p/g)).toHaveLength(BLOCKS);
    editor.destroy();
  });

  test("leaves notes below the threshold unpaged", async () => {
    const editor = createEditor(savedNoteHTML(5), true, 10);
    await created();

    expect(countPages(editor.state.doc)).toBe(0);
    expect(editor.state.doc.childCount).toBe(5);
    editor.destroy();
  });

  test("falls back to the default page size", async () => {
    const editor = new Editor({
      extensions: [
        StarterKit.configure({ document: false }),
        PagedDocument,
        Page,
        BlockId,
        Paging.configure({ enabled: true, thresholdBlocks: 10 })
      ],
      content: savedNoteHTML(DEFAULT_PAGE_SIZE * 3)
    });
    await created();

    expect(DEFAULT_PAGE_SIZE).toBe(50);
    expect(countPages(editor.state.doc)).toBe(3);
    expect(editor.state.doc.child(0).childCount).toBe(DEFAULT_PAGE_SIZE);
    editor.destroy();
  });

  test("does nothing when disabled", async () => {
    const editor = createEditor(savedNoteHTML(BLOCKS), false);
    await created();

    expect(countPages(editor.state.doc)).toBe(0);
    editor.destroy();
  });

  test("splitting neither dirties the note nor enters history", async () => {
    const editor = createEditor(savedNoteHTML(BLOCKS));
    let updates = 0;
    editor.on("update", () => updates++);
    await created();

    expect(countPages(editor.state.doc)).toBe(3);
    expect(updates).toBe(0);
    expect(editor.can().undo()).toBe(false);
    editor.destroy();
  });

  test("headings inside pages still reach the table of contents", async () => {
    let content = "";
    for (let i = 0; i < BLOCKS; i++)
      content += `<h1 data-block-id="h${i}">Heading ${i}</h1>`;
    const editor = createEditor(content);
    await created();

    expect(countPages(editor.state.doc)).toBe(3);
    const toc = getTableOfContents(
      editor.state.doc,
      editor.view.dom as HTMLElement
    );
    expect(toc).toHaveLength(BLOCKS);
    expect(toc[0].title).toBe("Heading 0");
    editor.destroy();
  });

  test("blocks inside pages keep getting block ids", async () => {
    let content = "";
    for (let i = 0; i < BLOCKS; i++) content += `<p>Paragraph ${i}.</p>`;
    const editor = createEditor(content);
    await created();

    editor.commands.setTextSelection(3);
    editor.commands.insertContent("x");
    await created();

    const page = editor.state.doc.child(0);
    let withIds = 0;
    page.forEach((node) => {
      if (node.attrs.blockId) withIds++;
    });
    expect(withIds).toBe(page.childCount);
    expect(editor.state.doc.child(0).attrs.blockId).toBeTruthy();
    editor.destroy();
  });

  test("editing a paged document still serializes flat", async () => {
    const editor = createEditor(savedNoteHTML(BLOCKS));
    await created();

    editor.commands.setTextSelection(3);
    editor.commands.insertContent("edited ");

    const html = editor.getHTML();
    expect(html).not.toContain("data-page");
    expect(html).toContain("edited");
    expect(html.match(/<p/g)).toHaveLength(BLOCKS);
    editor.destroy();
  });
});

describe("serialization cache", () => {
  test("matches the plain serializer exactly", async () => {
    const editor = createEditor(savedNoteHTML(BLOCKS));
    await created();

    expect(serializeDocumentHTML(editor.state.doc, editor.schema)).toBe(
      editor.getHTML()
    );
    editor.destroy();
  });

  test("reuses unedited pages and re-serializes only the edited one", async () => {
    const editor = createEditor(savedNoteHTML(BLOCKS));
    await created();

    serializeDocumentHTML(editor.state.doc, editor.schema);
    profiler.enable();
    editor.commands.setTextSelection(3);
    editor.commands.insertContent("edited ");
    serializeDocumentHTML(editor.state.doc, editor.schema);

    const counters = profiler.report().counters;
    expect(counters["serialize.cacheMiss"]).toBe(1);
    expect(counters["serialize.cacheHit"]).toBe(2);
    profiler.disable();
    profiler.reset();
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

    expect(serializeDocumentHTML(editor.state.doc, editor.schema)).toBe(
      editor.getHTML()
    );
    editor.destroy();
  });
});
