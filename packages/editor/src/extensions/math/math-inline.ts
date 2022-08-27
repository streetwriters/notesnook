import { Node, mergeAttributes } from "@tiptap/core";
import { mathPlugin } from "./plugin";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mathInline: {
      insertMathInline: () => ReturnType;
    };
  }
}
// simple input rule for inline math
const REGEX_INLINE_MATH_DOLLARS = /\$\$(.+)\$\$/; //new RegExp("\$(.+)\$", "i");
// negative lookbehind regex notation allows for escaped \$ delimiters
// (requires browser supporting ECMA2018 standard -- currently only Chrome / FF)
// (see https://javascript.info/regexp-lookahead-lookbehind)
// const REGEX_INLINE_MATH_DOLLARS_ESCAPED: RegExp = (() => {
//   // attempt to create regex with negative lookbehind
//   try {
//     return new RegExp("(?<!\\\\)\\$(.+)(?<!\\\\)\\$");
//   } catch (e) {
//     return REGEX_INLINE_MATH_DOLLARS;
//   }
// })();

export const MathInline = Node.create({
  name: "mathInline",
  group: "inline math",
  content: "text*", // important!
  inline: true, // important!
  atom: true, // important!
  code: true,

  parseHTML() {
    return [
      {
        tag: "span[class*='math-inline']" // important!,
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes({ class: "math-inline math-node" }, HTMLAttributes),
      0
    ];
  },

  addCommands() {
    return {
      insertMathInline:
        () =>
        ({ chain, tr }) => {
          const { $from } = tr.selection;
          return chain()
            .insertContent({ type: this.name, attrs: {} })
            .setNodeSelection($from.pos)
            .run();
        }
    };
  },

  addProseMirrorPlugins() {
    return [mathPlugin];
  },

  addInputRules() {
    return [
      {
        find: REGEX_INLINE_MATH_DOLLARS,
        handler: ({ state, match, range }) => {
          const { from: start, to: end } = range;
          const $start = state.doc.resolve(start);
          const index = $start.index();
          const $end = state.doc.resolve(end);

          // check if replacement valid
          if (!$start.parent.canReplaceWith(index, $end.index(), this.type)) {
            return null;
          }

          // perform replacement
          state.tr.replaceRangeWith(
            start,
            end,
            this.type.create(null, this.type.schema.text(match[1]))
          );
        }
      }
    ];
  }
});
