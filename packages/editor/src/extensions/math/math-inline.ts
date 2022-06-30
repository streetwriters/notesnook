import { Node, mergeAttributes } from "@tiptap/core";
import { inputRules } from "prosemirror-inputrules";
import {
  makeInlineMathInputRule,
  REGEX_INLINE_MATH_DOLLARS,
  mathPlugin,
} from "./plugin";

export const MathInline = Node.create({
  name: "math_inline",
  group: "inline math",
  content: "text*", // important!
  inline: true, // important!
  atom: true, // important!
  code: true,

  parseHTML() {
    return [
      {
        tag: "span[class*='math-inline']", // important!,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes({ class: "math-inline math-node" }, HTMLAttributes),
      0,
    ];
  },

  addProseMirrorPlugins() {
    const inputRulePlugin = inputRules({
      rules: [makeInlineMathInputRule(REGEX_INLINE_MATH_DOLLARS, this.type)],
    });

    return [mathPlugin, inputRulePlugin];
  },
});
