import { Extension, TextSerializer } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";
import { Node as ProseMirrorNode, Schema, Slice } from "prosemirror-model";

export const ClipboardTextSerializer = Extension.create({
  name: "clipboardTextSerializer",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("clipboardTextSerializer"),
        props: {
          clipboardTextSerializer: (content) => {
            const {
              editor: { schema },
            } = this;
            return getTextBetween(content, schema);
          },
        },
      }),
    ];
  },
});

function getTextBetween(slice: Slice, schema: Schema): string {
  const range = { from: 0, to: slice.size };
  const { from, to } = range;
  const separator = (node: ProseMirrorNode) =>
    node.attrs.spacing === "single" ? "\n" : "\n\n";
  let text = "";
  let separated = true;

  slice.content.nodesBetween(0, slice.size, (node, pos, parent, index) => {
    const textSerializer = schema.nodes[node.type.name]?.spec
      .toText as TextSerializer;

    if (textSerializer) {
      if (node.isBlock && !separated) {
        text += separator(node);
        separated = true;
      }

      if (parent) {
        text += textSerializer({
          node,
          pos,
          parent,
          index,
          range,
        });
      }
    } else if (node.isText) {
      text += node?.text?.slice(Math.max(from, pos) - pos, to - pos); // eslint-disable-line
      separated = false;
    } else if (node.isBlock && !separated) {
      text += separator(node);
      separated = true;
    }
  });

  return text;
}
