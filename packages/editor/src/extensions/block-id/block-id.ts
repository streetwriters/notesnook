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

import { Extension, NodeWithPos } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import { nanoid } from "nanoid";
import { getChangedNodes } from "../../utils/prosemirror";

const BLOCK_ID_TYPES = [
  "paragraph",
  "heading",
  "blockquote",
  "bulletList",
  "orderedList",
  "taskItem",
  "taskList",
  "table",
  "codeblock",
  "image",
  "outlineList",
  "mathBlock",
  "webclip",
  "embed"
];

export const BlockId = Extension.create({
  name: "blockId",

  addGlobalAttributes() {
    return [
      {
        types: BLOCK_ID_TYPES,
        attributes: {
          blockId: {
            default: null,
            keepOnSplit: false,
            parseHTML: (element) => {
              const id = element.getAttribute("data-block-id");
              return id || null;
            },
            renderHTML: (attributes) => {
              return {
                "data-block-id": attributes?.blockId
              };
            }
          }
        }
      }
    ];
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        appendTransaction: (transactions, oldState, newState) => {
          const isDocChanged = transactions.some((tr) => tr.docChanged);
          if (!isDocChanged) return null;

          const blocksWithoutBlockId: NodeWithPos[] = [];
          newState.tr.doc.forEach((n, offset) => {
            if (
              n.isBlock &&
              BLOCK_ID_TYPES.includes(n.type.name) &&
              !n.attrs.blockId
            )
              blocksWithoutBlockId.push({ node: n, pos: offset });
          });
          if (blocksWithoutBlockId.length > 0) {
            console.log(blocksWithoutBlockId);
            const { tr } = newState;
            for (const { node, pos } of blocksWithoutBlockId) {
              const id = nanoid(8);
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                blockId: id
              });
            }
            return tr;
          }

          return null;
        }
      })
    ];
  }
});
