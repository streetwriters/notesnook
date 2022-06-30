import { Node, mergeAttributes } from "@tiptap/core";
import { inputRules } from "prosemirror-inputrules";
import { makeBlockMathInputRule, REGEX_BLOCK_MATH_DOLLARS, } from "./plugin";
export var MathBlock = Node.create({
    name: "math_display",
    group: "block math",
    content: "text*",
    atom: true,
    code: true,
    parseHTML: function () {
        return [
            {
                tag: "div[class*='math-display']", // important!
            },
        ];
    },
    renderHTML: function (_a) {
        var HTMLAttributes = _a.HTMLAttributes;
        return [
            "div",
            mergeAttributes({ class: "math-display math-node" }, HTMLAttributes),
            0,
        ];
    },
    addProseMirrorPlugins: function () {
        var inputRulePlugin = inputRules({
            rules: [makeBlockMathInputRule(REGEX_BLOCK_MATH_DOLLARS, this.type)],
        });
        return [inputRulePlugin];
    },
});
