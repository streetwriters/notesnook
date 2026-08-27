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

import { afterEach, describe, expect, test } from "vitest";
import { Editor, Node } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Page, Paging } from "../index.js";
import { BlockId } from "../../block-id/block-id.js";
import { getScrollAnchor, restoreScrollAnchor } from "../anchor.js";

const PagedDocument = Node.create({
  name: "doc",
  topNode: true,
  content: "(page | block)+"
});

const BLOCKS = 500;
const PAGE_SIZE = 50;
const BLOCK_HEIGHT = 20;

function savedNoteHTML(n: number) {
  let content = "";
  for (let i = 0; i < n; i++)
    content += `<p data-block-id="blk${i}">Paragraph number ${i}.</p>`;
  return content;
}

function rect(top: number, height: number) {
  return {
    top,
    bottom: top + height,
    height,
    left: 0,
    right: 800,
    width: 800,
    x: 0,
    y: top,
    toJSON: () => ({})
  } as DOMRect;
}

const original = HTMLElement.prototype.getBoundingClientRect;

/** happy-dom lays nothing out, so blocks and pages get a synthetic geometry. */
function stubLayout(editor: Editor, scrollTop = 0) {
  const dom = editor.view.dom as HTMLElement;
  HTMLElement.prototype.getBoundingClientRect = function () {
    if (this === dom) return rect(-scrollTop, BLOCKS * BLOCK_HEIGHT);
    // the scroll container and anything outside the editor sits at the top
    if (!dom.contains(this)) return rect(0, 800);
    const siblings = this.parentElement?.children;
    const index = siblings ? Array.prototype.indexOf.call(siblings, this) : -1;
    if (index < 0) return rect(0, 0);
    if (this.parentElement === dom)
      return rect(
        index * PAGE_SIZE * BLOCK_HEIGHT - scrollTop,
        PAGE_SIZE * BLOCK_HEIGHT
      );
    const pageIndex = Array.prototype.indexOf.call(
      dom.children,
      this.parentElement
    );
    return rect(
      (pageIndex * PAGE_SIZE + index) * BLOCK_HEIGHT - scrollTop,
      BLOCK_HEIGHT
    );
  };
}

function createContainer() {
  const container = document.createElement("div");
  container.style.overflowY = "auto";
  Object.defineProperty(container, "scrollHeight", { value: 1000000 });
  Object.defineProperty(container, "clientHeight", { value: 800 });
  document.body.appendChild(container);
  return container;
}

function createEditor(container?: HTMLElement) {
  return new Editor({
    element: container,
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

afterEach(() => {
  HTMLElement.prototype.getBoundingClientRect = original;
});

describe("scroll anchor", () => {
  test("anchors on the first block in view, not a pixel offset", () => {
    const editor = createEditor(createContainer());
    stubLayout(editor);

    const anchor = getScrollAnchor(editor.view);
    expect(anchor?.blockId).toBe("blk0");
    expect(anchor?.offset).toBe(0);
    editor.destroy();
  });

  test("reveals the page holding the block before scrolling to it", () => {
    const editor = createEditor(createContainer());
    stubLayout(editor);

    // block 300 lives in page 6, which starts out as a placeholder
    const page = editor.state.doc.child(6);
    expect(
      (editor.view.dom.children[6] as HTMLElement).hasAttribute(
        "data-page-placeholder"
      )
    ).toBe(true);

    const restored = restoreScrollAnchor(editor.view, {
      blockId: "blk300",
      offset: 0
    });

    expect(restored).toBe(true);
    expect(
      (editor.view.dom.children[6] as HTMLElement).hasAttribute(
        "data-page-placeholder"
      )
    ).toBe(false);
    expect(
      editor.view.dom.querySelector('[data-block-id="blk300"]')
    ).not.toBeNull();
    expect(page.attrs.blockId).toBeTruthy();
    editor.destroy();
  });

  test("anchors on a placeholder page using the document", () => {
    const editor = createEditor(createContainer());
    // scrolled so the fold sits on page 6, which has never rendered
    stubLayout(editor, 6 * PAGE_SIZE * BLOCK_HEIGHT);
    expect(
      (editor.view.dom.children[6] as HTMLElement).hasAttribute(
        "data-page-placeholder"
      )
    ).toBe(true);

    const anchor = getScrollAnchor(editor.view);
    expect(anchor?.blockId).toBe("blk300");
    editor.destroy();
  });

  test("reports failure for a block that is no longer there", () => {
    const editor = createEditor(createContainer());
    stubLayout(editor);

    expect(
      restoreScrollAnchor(editor.view, { blockId: "gone", offset: 0 })
    ).toBe(false);
    editor.destroy();
  });
});
