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

import { Node, mergeAttributes } from "@tiptap/core";
import { insertMathNode } from "./plugin/index.js";
import { NodeSelection } from "prosemirror-state";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mathBlock: {
      insertMathBlock: () => ReturnType;
    };
  }
}

// simple inputrule for block math
const REGEX_BLOCK_MATH_DOLLARS = /\$\$\$\s+$/; //new RegExp("\$\$\s+$", "i");
export const MathBlock = Node.create({
  name: "mathBlock",
  group: "block math",
  content: "text*", // important!
  atom: true, // important!
  code: true,

  parseHTML() {
    return [
      {
        tag: "div[class*='math-block']" // important!
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes({ class: "math-block math-node" }, HTMLAttributes),
      0
    ];
  },

  addCommands() {
    return {
      insertMathBlock:
        () =>
        ({ state, dispatch, view }) => {
          return insertMathNode(this.type)(state, dispatch, view);
        }
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-M": () => this.editor.commands.insertMathBlock()
    };
  },

  addInputRules() {
    return [
      {
        find: REGEX_BLOCK_MATH_DOLLARS,
        handler: ({ state, range }) => {
          const { from: start, to: end } = range;
          const $start = state.doc.resolve(start);
          if (
            !$start
              .node(-1)
              .canReplaceWith(
                $start.index(-1),
                $start.indexAfter(-1),
                this.type
              )
          )
            return null;
          const tr = state.tr
            .delete(start, end)
            .setBlockType(start, start, this.type, null);

          tr.setSelection(
            NodeSelection.create(tr.doc, tr.mapping.map($start.pos - 1))
          );
        }
      }
    ];
  }
});
