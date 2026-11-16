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

import { createEditor, h, p } from "../../../../test-utils/index.js";
import { test, expect, describe } from "vitest";
import { Editor } from "@tiptap/core";
import { Blockquote } from "../blockquote.js";
import HorizontalRule from "@tiptap/extension-horizontal-rule";

function createDocument(children: HTMLElement[]) {
  const { editor } = createEditor({
    element: h("div"),
    initialContent: h("div", children).outerHTML,
    extensions: { blockquote: Blockquote, horizontalRule: HorizontalRule }
  });
  return editor;
}

function pressKey(editor: Editor, key: string) {
  editor.view.dom.dispatchEvent(
    new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true })
  );
}

describe("joining a paragraph into a blockquote followed by a horizontal rule", () => {
  const children = () => [
    h("blockquote", [p(["foo"])]),
    p(["bar"]),
    h("hr"),
    p(["qux1"])
  ];

  test("backspace at the start of the paragraph", () => {
    const editor = createDocument(children());
    editor.commands.setTextSelection(8);

    expect(() => pressKey(editor, "Backspace")).not.toThrow();
    expect(editor.getHTML()).toBe(
      "<blockquote><p>foo</p><p>bar</p></blockquote><hr><p>qux1</p>"
    );
  });

  test("delete at the end of the blockquote", () => {
    const editor = createDocument(children());
    editor.commands.setTextSelection(5);

    expect(() => pressKey(editor, "Delete")).not.toThrow();
    expect(editor.getHTML()).toBe(
      "<blockquote><p>foo</p><p>bar</p></blockquote><hr><p>qux1</p>"
    );
  });
});

describe("joining a paragraph into a blockquote followed by another blockquote", () => {
  const children = () => [
    h("blockquote", [p(["foo"])]),
    p(["bar"]),
    h("blockquote", [p(["baz"])])
  ];

  test("backspace at the start of the paragraph", () => {
    const editor = createDocument(children());
    editor.commands.setTextSelection(8);

    pressKey(editor, "Backspace");
    expect(editor.getHTML()).toBe(
      "<blockquote><p>foo</p><p>bar</p><p>baz</p></blockquote>"
    );
  });

  test("delete at the end of the blockquote", () => {
    const editor = createDocument(children());
    editor.commands.setTextSelection(5);

    pressKey(editor, "Delete");
    expect(editor.getHTML()).toBe(
      "<blockquote><p>foo</p><p>bar</p><p>baz</p></blockquote>"
    );
  });
});
