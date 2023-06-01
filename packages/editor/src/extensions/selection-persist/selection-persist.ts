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
import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { SearchStorage } from "../search-replace";

const key = new PluginKey("selection-persist-key");
export const SelectionPersist = Extension.create({
  name: "selection-persist",

  addProseMirrorPlugins() {
    let isFocused = false;
    let isBlurred = false;
    const editor = this.editor;
    return [
      new Plugin({
        key,
        props: {
          decorations(state) {
            return key.getState(state);
          }
        },
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, _value, oldState) {
            const { isSearching } = (editor.storage.searchreplace ||
              {}) as Partial<SearchStorage>;
            if (isSearching || !editor.isEditable) return DecorationSet.empty;

            // isBlurred should remain true until isFocused becomes true
            // isFocused should remain true until isBlurred becomes true

            const _isBlurred = !!tr.getMeta("blur");
            const _isFocused = !!tr.getMeta("focus");

            if (_isFocused) {
              isBlurred = false;
              isFocused = true;
            }

            if (_isBlurred) {
              isBlurred = true;
              isFocused = false;
            }

            const { from, to } = oldState.selection;
            if (isBlurred) {
              return DecorationSet.create(tr.doc, [
                Decoration.inline(from, to, {
                  style:
                    "background-color: var(--dimPrimary); font-family: inherit;"
                })
              ]);
            } else if (isFocused) {
              return DecorationSet.empty;
            }
            return DecorationSet.empty;
          }
        }
      })
    ];
  }
});
