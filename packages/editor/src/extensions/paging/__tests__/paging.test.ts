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
import { Page, Paging, countPages, flattenBlocks } from "../index.js";
import { BlockId } from "../../block-id/block-id.js";

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

  test("leaves notes below the threshold unpaged", async () => {
    const editor = createEditor(savedNoteHTML(5), true, 10);
    await created();

    expect(countPages(editor.state.doc)).toBe(0);
    expect(editor.state.doc.childCount).toBe(5);
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
