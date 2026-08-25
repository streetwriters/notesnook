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
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { DecorationSet } from "@tiptap/pm/view";
import { Virtualization, virtualizationKey } from "../index.js";
import { BlockId } from "../../block-id/block-id.js";
import { profiler } from "../../../utils/profiler.js";

const BLOCKS = 40;

function savedNoteHTML(n: number, extra = "") {
  let content = "";
  for (let i = 0; i < n; i++)
    content += `<p data-block-id="blk${i}">Paragraph number ${i}.</p>`;
  return content + extra;
}

function createEditor(content: string) {
  return new Editor({
    extensions: [
      StarterKit,
      BlockId,
      Virtualization.configure({ enabled: true, thresholdBlocks: 5 })
    ],
    content
  });
}

function decorationsOf(editor: Editor): DecorationSet {
  return (
    virtualizationKey.getState(editor.state)?.decorations ?? DecorationSet.empty
  );
}

function counters() {
  return profiler.report().counters;
}

function blockRange(editor: Editor, index: number) {
  let from = 0;
  for (let i = 0; i < index; i++) from += editor.state.doc.child(i).nodeSize;
  return { from, to: from + editor.state.doc.child(index).nodeSize };
}

function isMaterialized(editor: Editor, index: number) {
  const { from, to } = blockRange(editor, index);
  return decorationsOf(editor)
    .find(from, to)
    .some(
      (d) =>
        d.from === from &&
        d.to === to &&
        (d.spec as { materialize?: boolean }).materialize
    );
}

afterEach(() => {
  profiler.disable();
  profiler.reset();
});

describe("decoration updates", () => {
  test("a text edit maps the decorations instead of rebuilding them", () => {
    const editor = createEditor(savedNoteHTML(BLOCKS));
    profiler.enable();

    editor.view.dispatch(editor.state.tr.insertText("x", 2));

    expect(counters()["virtualization.decorationMaps"]).toBeGreaterThanOrEqual(
      1
    );
    expect(counters()["virtualization.decorationBuilds"]).toBeUndefined();
    editor.destroy();
  });

  test("adding a block rebuilds the decorations", () => {
    const editor = createEditor(savedNoteHTML(BLOCKS));
    profiler.enable();

    editor.commands.insertContentAt(2, "<p>new block</p>");

    expect(
      counters()["virtualization.decorationBuilds"]
    ).toBeGreaterThanOrEqual(1);
    editor.destroy();
  });

  test("a transaction that changes nothing relevant reuses the state", () => {
    const editor = createEditor(savedNoteHTML(BLOCKS));
    profiler.enable();

    editor.view.dispatch(editor.state.tr.setMeta("unrelated", true));

    expect(counters()["virtualization.decorationReuses"]).toBe(1);
    expect(counters()["virtualization.decorationBuilds"]).toBeUndefined();
    expect(counters()["virtualization.decorationMaps"]).toBeUndefined();
    editor.destroy();
  });

  test("the caret's block stays materialized while typing at its end", () => {
    const editor = createEditor(savedNoteHTML(BLOCKS));
    const endOfFirstBlock = editor.state.doc.child(0).nodeSize - 1;
    editor.commands.setTextSelection(endOfFirstBlock);
    profiler.enable();

    for (let i = 0; i < 5; i++)
      editor.view.dispatch(
        editor.state.tr.insertText("a", editor.state.selection.from)
      );

    expect(isMaterialized(editor, 0)).toBe(true);
    expect(counters()["virtualization.decorationBuilds"]).toBeUndefined();
    editor.destroy();
  });

  test("mapped decorations keep covering the whole edited node", () => {
    const editor = createEditor(savedNoteHTML(BLOCKS));
    editor.commands.setTextSelection(3);
    profiler.enable();

    editor.view.dispatch(editor.state.tr.insertText("inserted", 3));

    const { from, to } = blockRange(editor, 0);
    const decoration = decorationsOf(editor)
      .find(from, to)
      .find((d) => (d.spec as { materialize?: boolean }).materialize);
    expect(decoration?.from).toBe(from);
    expect(decoration?.to).toBe(to);
    editor.destroy();
  });

  test("non-pageable blocks get no decoration", () => {
    const editor = createEditor(
      savedNoteHTML(BLOCKS, "<pre><code>not pageable</code></pre>")
    );

    const lastIndex = editor.state.doc.childCount - 1;
    expect(editor.state.doc.child(lastIndex).type.name).toBe("codeBlock");
    expect(isMaterialized(editor, lastIndex)).toBe(false);
    editor.destroy();
  });

  test("non-pageable blocks do not inflate the decoration set", () => {
    let rules = "";
    for (let i = 0; i < 100; i++) rules += "<hr>";
    const editor = createEditor(savedNoteHTML(BLOCKS, rules));

    expect(editor.state.doc.childCount).toBe(BLOCKS + 100);
    expect(
      decorationsOf(editor).find(0, editor.state.doc.content.size).length
    ).toBeLessThan(10);
    editor.destroy();
  });

  test("indexes top-level positions once per document version", () => {
    profiler.enable();
    const editor = createEditor(savedNoteHTML(BLOCKS));

    expect(editor.state.doc.childCount).toBe(BLOCKS);
    expect(counters()["virtualization.topLevelIndexBuilds"]).toBe(1);
    editor.destroy();
  });
});
