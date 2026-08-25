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
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Virtualization, virtualizationKey } from "../index.js";
import { BlockId } from "../../block-id/block-id.js";

const BLOCKS = 60;
const BLOCK_HEIGHT = 100;

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

/** happy-dom does no layout, so the block geometry is stubbed in. */
function stubLayout(editor: Editor, blockHeight = BLOCK_HEIGHT) {
  const dom = editor.view.dom as HTMLElement;
  const total = dom.children.length * blockHeight;
  dom.getBoundingClientRect = () => rect(0, total);
  let top = 0;
  for (const child of Array.from(dom.children)) {
    const childTop = top;
    (child as HTMLElement).getBoundingClientRect = () =>
      rect(childTop, blockHeight);
    top += blockHeight;
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

function visibleBlocks(editor: Editor) {
  return [...(virtualizationKey.getState(editor.state)?.visible ?? [])].sort();
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

function createEditor() {
  return new Editor({
    extensions: [
      StarterKit,
      BlockId,
      Virtualization.configure({ enabled: true, thresholdBlocks: 5 })
    ],
    content: savedNoteHTML(BLOCKS)
  });
}

describe("viewport window", () => {
  test("observes nothing: no IntersectionObserver is created", async () => {
    const editor = createEditor();
    stubLayout(editor);
    editor.view.dispatch(editor.state.tr.setMeta("nudge", true));
    await frames();

    expect(observers).toBe(0);
    editor.destroy();
  });

  test("tracks only the blocks within the overscan band", async () => {
    const editor = createEditor();
    stubLayout(editor);
    editor.view.dispatch(editor.state.tr.setMeta("nudge", true));
    await frames();

    const visible = visibleBlocks(editor);
    expect(visible.length).toBeGreaterThan(0);
    expect(visible.length).toBeLessThan(BLOCKS);

    // window.innerHeight is 768 in happy-dom and the add band is one viewport
    // in each direction, so blocks past ~1536px must stay out.
    const highest = Math.max(
      ...visible.map((id) => Number(id.replace("blk", "")))
    );
    expect(highest * BLOCK_HEIGHT).toBeLessThanOrEqual(1536);
    editor.destroy();
  });

  test("does not measure while the editor has no layout", async () => {
    const editor = createEditor();
    editor.view.dispatch(editor.state.tr.setMeta("nudge", true));
    await frames();

    expect(visibleBlocks(editor)).toEqual([]);
    editor.destroy();
  });

  test("keeps the visible unit still when a placeholder resizes", async () => {
    const editor = createEditor();
    stubLayout(editor);
    editor.view.dispatch(editor.state.tr.setMeta("nudge", true));
    await frames();

    const container = editor.view.dom.parentElement;
    const before = container?.scrollTop ?? 0;

    // the second block renders and turns out to be far taller than its
    // estimate: everything after it moves, so the scroll must follow
    const dom = editor.view.dom as HTMLElement;
    let top = 0;
    for (const [index, child] of Array.from(dom.children).entries()) {
      const height = index === 1 ? BLOCK_HEIGHT * 10 : BLOCK_HEIGHT;
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

  test("keeps blocks that drift into the hysteresis band", async () => {
    const editor = createEditor();
    stubLayout(editor);
    editor.view.dispatch(editor.state.tr.setMeta("nudge", true));
    await frames();
    const before = visibleBlocks(editor);

    // Everything shifts down by half a viewport: blocks that leave the add
    // band but stay inside the keep band must not be dropped.
    const dom = editor.view.dom as HTMLElement;
    let top = 384;
    for (const child of Array.from(dom.children)) {
      const childTop = top;
      (child as HTMLElement).getBoundingClientRect = () =>
        rect(childTop, BLOCK_HEIGHT);
      top += BLOCK_HEIGHT;
    }
    editor.view.dispatch(editor.state.tr.setMeta("nudge", true));
    await frames();

    for (const id of before) expect(visibleBlocks(editor)).toContain(id);
    editor.destroy();
  });
});
