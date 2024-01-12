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

import { Node, NodeWithPos } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import { nanoid } from "nanoid";
import { getChangedNodes } from "../../utils/prosemirror";

const types: { [name: string]: boolean } = {
  heading: true,
  paragraph: true
};

export const BlockId = Node.create({
  name: "blockId",

  addGlobalAttributes() {
    return [
      {
        types: Object.keys(types),
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
          // no changes
          if (newState.doc === oldState.doc) {
            return;
          }
          const tr = newState.tr;

          const blockIds = new Set<string>();
          const blocksWithoutBlockId: NodeWithPos[] = [];

          for (const tr of transactions) {
            blocksWithoutBlockId.push(
              ...getChangedNodes(tr, {
                descend: false,
                predicate: (n) => {
                  const shouldInclude =
                    n.isBlock &&
                    (!n.attrs.blockId || blockIds.has(n.attrs.blockId));

                  if (n.attrs.blockId) blockIds.add(n.attrs.blockId);
                  return shouldInclude;
                }
              })
            );
          }

          console.log(blocksWithoutBlockId);
          for (const { node, pos } of blocksWithoutBlockId) {
            const id = nanoid(8);
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              blockId: id
            });
          }
          return tr;
        }
      })
    ];
  }
});
