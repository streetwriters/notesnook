import { Node, mergeAttributes } from "@tiptap/core";
import { inputRules } from "prosemirror-inputrules";
import {
  mathPlugin,
  makeBlockMathInputRule,
  REGEX_BLOCK_MATH_DOLLARS,
} from "./plugin";

export const MathBlock = Node.create({
  name: "math_display",
  group: "block math",
  content: "text*", // important!
  atom: true, // important!
  code: true,

  parseHTML() {
    return [
      {
        tag: `div[class*='math-display']`, // important!
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes({ class: "math-display math-node" }, HTMLAttributes),
      0,
    ];
  },

  addProseMirrorPlugins() {
    const inputRulePlugin = inputRules({
      rules: [makeBlockMathInputRule(REGEX_BLOCK_MATH_DOLLARS, this.type)],
    });

    return [inputRulePlugin];
  },
});
