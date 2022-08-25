import { Node, mergeAttributes } from "@tiptap/core";
import { inputRules } from "prosemirror-inputrules";
import {
  insertMathNode,
  makeBlockMathInputRule,
  REGEX_BLOCK_MATH_DOLLARS,
} from "./plugin";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mathBlock: {
      insertMathBlock: () => ReturnType;
    };
  }
}

export const MathBlock = Node.create({
  name: "mathBlock",
  group: "block math",
  content: "text*", // important!
  atom: true, // important!
  code: true,

  parseHTML() {
    return [
      {
        tag: `div[class*='math-block']`, // important!
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes({ class: "math-block math-node" }, HTMLAttributes),
      0,
    ];
  },

  addCommands() {
    return {
      insertMathBlock:
        () =>
        ({ state, dispatch, view }) => {
          return insertMathNode(this.type)(state, dispatch, view);
        },
    };
  },

  addProseMirrorPlugins() {
    const inputRulePlugin = inputRules({
      rules: [makeBlockMathInputRule(REGEX_BLOCK_MATH_DOLLARS, this.type)],
    });

    return [inputRulePlugin];
  },
});
