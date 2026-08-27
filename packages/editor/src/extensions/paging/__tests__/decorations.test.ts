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
import { DecorationSet } from "@tiptap/pm/view";
import { Page, Paging, viewportKey } from "../index.js";
import { BlockId } from "../../block-id/block-id.js";
import { profiler } from "../../../utils/profiler.js";

const PagedDocument = Node.create({
  name: "doc",
  topNode: true,
  content: "(page | block)+"
});

const BLOCKS = 200;
const PAGE_SIZE = 50;

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

function decorations(editor: Editor): DecorationSet {
  return viewportKey.getState(editor.state)?.decorations ?? DecorationSet.empty;
}

function counters() {
  return profiler.report().counters;
}

afterEach(() => {
  profiler.disable();
  profiler.reset();
});

describe("viewport decorations", () => {
  test("a transaction that changes nothing relevant reuses the state", () => {
    const editor = createEditor();
    profiler.enable();

    const before = decorations(editor);
    editor.view.dispatch(editor.state.tr.setMeta("unrelated", true));

    expect(decorations(editor)).toBe(before);
    expect(counters()["paging.decorationReuses"]).toBe(1);
    expect(counters()["paging.decorationBuilds"]).toBeUndefined();
    editor.destroy();
  });

  test("a text edit maps the decorations instead of rebuilding them", () => {
    const editor = createEditor();
    profiler.enable();

    editor.view.dispatch(editor.state.tr.insertText("x", 3));

    expect(counters()["paging.decorationMaps"]).toBeGreaterThanOrEqual(1);
    expect(counters()["paging.decorationBuilds"]).toBeUndefined();
    editor.destroy();
  });

  test("adding a page rebuilds the decorations", () => {
    const editor = createEditor();
    profiler.enable();

    editor.view.dispatch(
      editor.state.tr.replaceWith(
        0,
        0,
        editor.state.schema.nodes.paragraph.create()
      )
    );

    expect(counters()["paging.decorationBuilds"]).toBeGreaterThanOrEqual(1);
    editor.destroy();
  });

  test("the caret's page stays rendered while typing at its end", () => {
    const editor = createEditor();
    const firstPage = editor.state.doc.child(0);
    editor.commands.setTextSelection(firstPage.nodeSize - 2);
    profiler.enable();

    for (let i = 0; i < 5; i++)
      editor.view.dispatch(
        editor.state.tr.insertText("a", editor.state.selection.from)
      );

    const page = editor.view.dom.children[0] as HTMLElement;
    expect(page.hasAttribute("data-page-placeholder")).toBe(false);
    editor.destroy();
  });

  test("only pages are decorated", () => {
    const editor = createEditor();

    const spans = decorations(editor).find(0, editor.state.doc.content.size);
    expect(spans.length).toBeGreaterThan(0);
    for (const span of spans) {
      const node = editor.state.doc.nodeAt(span.from);
      expect(node?.type.name).toBe("page");
    }
    editor.destroy();
  });
});
