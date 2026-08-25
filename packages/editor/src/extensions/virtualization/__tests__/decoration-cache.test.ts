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
import { EditorState, Plugin } from "@tiptap/pm/state";
import { DecorationSet } from "@tiptap/pm/view";
import { Virtualization, virtualizationKey } from "../index.js";
import { BlockId } from "../../block-id/block-id.js";

const BLOCKS = 60;

function html(n: number) {
  let content = "";
  for (let i = 0; i < n; i++)
    content += `<p data-block-id="blk${i}">Paragraph number ${i}.</p>`;
  return content;
}

function createEditor() {
  return new Editor({
    extensions: [
      StarterKit,
      BlockId,
      Virtualization.configure({ enabled: true, thresholdBlocks: 10 })
    ],
    content: html(BLOCKS)
  });
}

function decorationsOf(editor: Editor, state: EditorState): DecorationSet {
  const plugin = editor.state.plugins.find(
    (p) => p.spec.key === virtualizationKey
  ) as Plugin;
  const decorations = plugin.props.decorations as (
    this: Plugin,
    state: EditorState
  ) => DecorationSet;
  return decorations.call(plugin, state);
}

describe("virtualization decoration cache", () => {
  test("returns the identical set for an unchanged state", () => {
    const editor = createEditor();

    const first = decorationsOf(editor, editor.state);
    const second = decorationsOf(editor, editor.state);

    expect(second).toBe(first);
    editor.destroy();
  });

  test("rebuilds when the document changes", () => {
    const editor = createEditor();
    const before = decorationsOf(editor, editor.state);

    editor.view.dispatch(editor.state.tr.insertText("typed", 1));
    const after = decorationsOf(editor, editor.state);

    expect(after).not.toBe(before);
    editor.destroy();
  });

  test("rebuilds when the visible set changes", () => {
    const editor = createEditor();
    const before = decorationsOf(editor, editor.state);

    editor.view.dispatch(
      editor.state.tr
        .setMeta(virtualizationKey, { visible: new Set(["blk30"]) })
        .setMeta("addToHistory", false)
    );
    const after = decorationsOf(editor, editor.state);

    expect(after).not.toBe(before);
    editor.destroy();
  });

  test("rebuilds when the selection moves to another block", () => {
    const editor = createEditor();
    const before = decorationsOf(editor, editor.state);

    const target = editor.state.doc.resolve(1).after(1) + 1;
    editor.commands.setTextSelection(target);
    const after = decorationsOf(editor, editor.state);

    expect(after).not.toBe(before);
    editor.destroy();
  });

  test("keeps the cached set when a transaction changes nothing relevant", () => {
    const editor = createEditor();
    const before = decorationsOf(editor, editor.state);

    editor.view.dispatch(editor.state.tr.setMeta("unrelated", true));
    const after = decorationsOf(editor, editor.state);

    expect(after).toBe(before);
    editor.destroy();
  });
});
