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
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Virtualization } from "../index.js";
import { BlockId } from "../../block-id/block-id.js";

const BLOCKS = 400;

/**
 * Mirrors a saved Notesnook note: BlockId renders `data-block-id` into the
 * stored HTML, and paging keys off it.
 */
function savedNoteHTML(n: number) {
  let html = "";
  for (let i = 0; i < n; i++)
    html += `<p data-block-id="blk${i}">Paragraph number ${i} with filler.</p>`;
  return html;
}

/** A legacy/imported/pasted note, whose HTML has no block ids yet. */
function unidentifiedHTML(n: number) {
  let html = "";
  for (let i = 0; i < n; i++)
    html += `<p>Paragraph number ${i} with filler.</p>`;
  return html;
}

function makeEditor(enabled: boolean, content = savedNoteHTML(BLOCKS)) {
  return new Editor({
    element: document.createElement("div"),
    content,
    extensions: [
      StarterKit,
      // Paging keys off blockId: a block without one always materializes
      // (see viewport-plugin), so this is required, not incidental.
      BlockId,
      Virtualization.configure({ enabled, thresholdBlocks: 50 })
    ]
  });
}

function placeholderCount(editor: Editor) {
  return editor.view.dom.querySelectorAll("[data-virtual-placeholder]").length;
}

describe("virtualization: the first view", () => {
  test("the view built by the Editor constructor is already virtualized", () => {
    const editor = makeEditor(true);

    // Nothing has run except the constructor - no React effect, no manual
    // createView(). If this passes, the document was never mounted in full.
    expect(editor.state.doc.childCount).toBe(BLOCKS);
    expect(placeholderCount(editor)).toBeGreaterThan(0);

    editor.destroy();
  });

  test("recreating the view keeps virtualization installed", () => {
    const editor = makeEditor(true);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - mirrors what useEditor does on every deps change
    editor.createView();

    expect(editor.state.doc.childCount).toBe(BLOCKS);
    expect(placeholderCount(editor)).toBeGreaterThan(0);

    editor.destroy();
  });

  test("nothing is virtualized when the extension is disabled", () => {
    const editor = makeEditor(false);

    expect(editor.state.doc.childCount).toBe(BLOCKS);
    expect(placeholderCount(editor)).toBe(0);

    editor.destroy();
  });

  // KNOWN GAP, not desired behaviour. BlockId assigns ids from an
  // appendTransaction, which does not run during construction, so a note whose
  // stored HTML has no data-block-id renders in full on its first view. The fix
  // is to assign block ids at parse/load time - see
  // docs/editor-performance/05-per-transaction-work.md section 4.1. When that
  // lands, this expectation should flip to toBeGreaterThan(0).
  test("a note with no block ids is not yet paged on its first view", () => {
    const editor = makeEditor(true, unidentifiedHTML(BLOCKS));

    expect(editor.state.doc.childCount).toBe(BLOCKS);
    expect(placeholderCount(editor)).toBe(0);

    editor.destroy();
  });
});
