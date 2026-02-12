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
import { Plugin } from "@tiptap/pm/state";
import { nanoid } from "nanoid";
import {
  AttributeUpdate,
  BatchAttributeStep
} from "../../utils/batch-attribute-step.js";

const NESTED_BLOCK_ID_TYPES = ["callout"];
const BLOCK_ID_TYPES = [
  "paragraph",
  "heading",
  "blockquote",
  "bulletList",
  "orderedList",
  "checkList",
  "taskList",
  "table",
  "callout",
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
              if (!attributes?.blockId) return {};
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

          const blockIds = new Set<string>();
          const updates: AttributeUpdate[] = [];
          const { tr } = newState;

          tr.doc.forEach(function addBlockId(n, offset) {
            if (!n.isBlock || !BLOCK_ID_TYPES.includes(n.type.name)) return;

            const currentId = n.attrs.blockId;
            const shouldUpdateId = !currentId || blockIds.has(currentId);
            const finalId = shouldUpdateId ? nanoid(8) : currentId;

            if (shouldUpdateId) {
              updates.push({
                pos: offset,
                attrName: "blockId",
                value: finalId
              });
            }

            blockIds.add(finalId);

            if (NESTED_BLOCK_ID_TYPES.includes(n.type.name))
              n.forEach((n, pos) => addBlockId(n, offset + pos + 1));
          });

          if (updates.length > 0) {
            tr.step(new BatchAttributeStep(updates));
            tr.setMeta("ignoreEdit", true);
            return tr;
          }

          return null;
        }
      })
    ];
  }
});
