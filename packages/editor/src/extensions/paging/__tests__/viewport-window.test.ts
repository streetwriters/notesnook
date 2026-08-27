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

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { Editor, Node } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Page, Paging, viewportKey } from "../index.js";
import { BlockId } from "../../block-id/block-id.js";

const PagedDocument = Node.create({
  name: "doc",
  topNode: true,
  content: "(page | block)+"
});

const PAGES = 60;
const PAGE_HEIGHT = 100;

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

/** happy-dom does no layout, so the page geometry is stubbed in. */
function stubLayout(editor: Editor, pageHeight = PAGE_HEIGHT) {
  const dom = editor.view.dom as HTMLElement;
  dom.getBoundingClientRect = () => rect(0, dom.children.length * pageHeight);
  let top = 0;
  for (const child of Array.from(dom.children)) {
    const childTop = top;
    (child as HTMLElement).getBoundingClientRect = () =>
      rect(childTop, pageHeight);
    top += pageHeight;
  }
}

function frames(count = 2) {
  return new Promise<void>((resolve) => {
    let remaining = count;
    const tick = () =>
      remaining-- > 0 ? requestAnimationFrame(tick) : resolve();
    tick();
  });
}

/** The indexes of the pages the window currently considers visible. */
function visiblePages(editor: Editor) {
  const visible = viewportKey.getState(editor.state)?.visible ?? new Set();
  const indexes: number[] = [];
  editor.state.doc.forEach((page, _offset, index) => {
    if (visible.has(page.attrs.blockId)) indexes.push(index);
  });
  return indexes;
}

// one block per page keeps the geometry easy to reason about
function createEditor() {
  return new Editor({
    extensions: [
      StarterKit.configure({ document: false }),
      PagedDocument,
      Page,
      BlockId,
      Paging.configure({ enabled: true, pageSize: 1, thresholdBlocks: 5 })
    ],
    content: savedNoteHTML(PAGES)
  });
}

let observers: number;
const RealIntersectionObserver = globalThis.IntersectionObserver;

beforeEach(() => {
  observers = 0;
  globalThis.IntersectionObserver = class extends RealIntersectionObserver {
    constructor(...args: ConstructorParameters<typeof IntersectionObserver>) {
      super(...args);
      observers++;
    }
  };
});

afterEach(() => {
  globalThis.IntersectionObserver = RealIntersectionObserver;
  vi.restoreAllMocks();
});

describe("viewport window", () => {
  test("observes nothing: no IntersectionObserver is created", async () => {
    const editor = createEditor();
    stubLayout(editor);
    editor.view.dispatch(editor.state.tr.setMeta("nudge", true));
    await frames();

    expect(observers).toBe(0);
    editor.destroy();
  });

  test("tracks only the pages within the overscan band", async () => {
    const editor = createEditor();
    stubLayout(editor);
    editor.view.dispatch(editor.state.tr.setMeta("nudge", true));
    await frames();

    const visible = visiblePages(editor);
    expect(visible.length).toBeGreaterThan(0);
    expect(visible.length).toBeLessThan(PAGES);
    // happy-dom reports a 768px viewport and the band reaches one viewport
    // past it, so nothing beyond ~1536px may be tracked
    expect(Math.max(...visible) * PAGE_HEIGHT).toBeLessThanOrEqual(1536);
    editor.destroy();
  });

  test("does not measure while the editor has no layout", async () => {
    const editor = createEditor();
    editor.view.dispatch(editor.state.tr.setMeta("nudge", true));
    await frames();

    expect(visiblePages(editor)).toEqual([]);
    editor.destroy();
  });

  test("keeps pages that drift into the hysteresis band", async () => {
    const editor = createEditor();
    stubLayout(editor);
    editor.view.dispatch(editor.state.tr.setMeta("nudge", true));
    await frames();
    const before = visiblePages(editor);

    const dom = editor.view.dom as HTMLElement;
    let top = 384;
    for (const child of Array.from(dom.children)) {
      const childTop = top;
      (child as HTMLElement).getBoundingClientRect = () =>
        rect(childTop, PAGE_HEIGHT);
      top += PAGE_HEIGHT;
    }
    editor.view.dispatch(editor.state.tr.setMeta("nudge", true));
    await frames();

    const after = visiblePages(editor);
    for (const index of before) expect(after).toContain(index);
    editor.destroy();
  });

  test("keeps the visible page still when a placeholder resizes", async () => {
    const editor = createEditor();
    stubLayout(editor);
    editor.view.dispatch(editor.state.tr.setMeta("nudge", true));
    await frames();
    const container = editor.view.dom.parentElement;
    const before = container?.scrollTop ?? 0;

    const dom = editor.view.dom as HTMLElement;
    let top = 0;
    for (const [index, child] of Array.from(dom.children).entries()) {
      const height = index === 1 ? PAGE_HEIGHT * 10 : PAGE_HEIGHT;
      const childTop = top;
      (child as HTMLElement).getBoundingClientRect = () =>
        rect(childTop, height);
      top += height;
    }
    editor.view.dispatch(editor.state.tr.setMeta("nudge", true));
    await frames();

    expect(container?.scrollTop ?? 0).toBeGreaterThanOrEqual(before);
    editor.destroy();
  });

  test("re-measures when the editor is re-laid out", async () => {
    const observed: Element[] = [];
    const RealResizeObserver = globalThis.ResizeObserver;
    let notify: (() => void) | undefined;
    globalThis.ResizeObserver = class {
      constructor(callback: () => void) {
        notify = callback;
      }
      observe(element: Element) {
        observed.push(element);
      }
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;

    const editor = createEditor();
    stubLayout(editor);
    await frames();

    expect(observed).toContain(editor.view.dom);

    const dom = editor.view.dom as HTMLElement;
    let top = 0;
    for (const child of Array.from(dom.children)) {
      const childTop = top;
      (child as HTMLElement).getBoundingClientRect = () =>
        rect(childTop, PAGE_HEIGHT * 4);
      top += PAGE_HEIGHT * 4;
    }
    notify?.();
    await frames();

    expect(visiblePages(editor).length).toBeGreaterThan(0);
    globalThis.ResizeObserver = RealResizeObserver;
    editor.destroy();
  });
});
