import { Node } from "@tiptap/core";
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
        appendTransaction: (_transactions, oldState, newState) => {
          // no changes
          if (newState.doc === oldState.doc) {
            return;
          }
          const tr = newState.tr;

          const blockIds = new Set<string>();
          const blocksWithoutBlockId: any[] = [];

          for (const tr of _transactions) {
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
