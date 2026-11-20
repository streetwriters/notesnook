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

import { test, expect, describe } from "vitest";
import { createEditor, h } from "../../../../test-utils/index.js";

// Pressing Enter with a selection that spans whole blocks used to crash with
// "Inserted content deeper than insertion position" (issue #10391), and then
// only deleted the selection without adding a new line.
const cases: { name: string; html: string; anchor: number; head: number }[] =
  [
    // two empty lines selected with Shift+ArrowUp
    { name: "two empty paragraphs", html: "<p></p><p></p>", anchor: 3, head: 1 },
    {
      name: "blockquote followed by a paragraph",
      html: "<blockquote><p>quote</p></blockquote><p>text</p>",
      anchor: 14,
      head: 2
    },
    {
      name: "paragraph followed by a blockquote",
      html: "<p>text</p><blockquote><p>quote</p></blockquote>",
      anchor: 14,
      head: 1
    }
  ];

describe("enter on a selection spanning blocks", () => {
  for (const { name, html, anchor, head } of cases) {
    test(name, () => {
      const { editor } = createEditor({
        element: h("div"),
        initialContent: html,
        extensions: {}
      });
      editor.commands.setTextSelection({ from: anchor, to: head });
      expect(editor.state.selection.empty).toBe(false);

      editor.view.dom.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter" })
      );

      expect(editor.getHTML()).toBe("<p></p><p></p>");
      expect(editor.state.selection.$from.index(0)).toBe(1);
    });
  }
});
