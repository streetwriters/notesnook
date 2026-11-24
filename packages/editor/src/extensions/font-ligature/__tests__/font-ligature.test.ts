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

import { expect, test } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { FontLigature } from "../font-ligature.js";

function type(editor: Editor, text: string) {
  const { view } = editor;
  for (const char of text) {
    const { from, to } = view.state.selection;
    const handled = view.someProp("handleTextInput", (f) =>
      f(view, from, to, char)
    );
    if (!handled) view.dispatch(view.state.tr.insertText(char, from, to));
  }
}

test("font ligatures work when only the font ligature input rules are enabled", () => {
  const editor = new Editor({
    extensions: [StarterKit, FontLigature.configure({ enabled: true })],
    // same as the web app with markdown shortcuts turned off
    enableInputRules: [FontLigature.name]
  });

  type(editor, "a -> b != c");
  expect(editor.getText()).toBe("a → b ≠ c");

  // markdown input rules stay disabled
  editor.commands.setContent("");
  type(editor, "# heading");
  expect(editor.getHTML()).toBe("<p># heading</p>");
});
