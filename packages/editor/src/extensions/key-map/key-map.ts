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

import { Extension } from "@tiptap/core";
import { isInTable } from "@tiptap/pm/tables";
import { CodeBlock } from "../code-block/index.js";
import { showLinkPopup } from "../../toolbar/popups/link-popup.js";
import { isListActive } from "../../utils/list.js";

export const KeyMap = Extension.create({
  name: "key-map",

  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        if (
          isListActive(editor) ||
          isInTable(editor.state) ||
          editor.isActive(CodeBlock.name)
        )
          return false;

        return editor.commands.insertContent("\t");
      },
      "Shift-Tab": ({ editor }) => {
        if (isListActive(editor)) return false;
        return true;
      },
      "Mod-\\": ({ editor }) => {
        editor
          .chain()
          .focus()
          .clearNodes()
          .unsetAllMarks()
          .unsetMark("link")
          .run();
        return true;
      },
      "Shift-Mod-L": ({ editor }) => {
        editor.storage.createInternalLink?.().then((link) => {
          if (!link) return;

          const selectedText = editor.state.doc.textBetween(
            editor.state.selection.from,
            editor.state.selection.to
          );
          editor.commands.setLink({
            ...link,
            title: selectedText || link.title
          });
        });
        return true;
      },
      "Mod-k": ({ editor }) => {
        showLinkPopup(editor);
        return true;
      }
    };
  }
});
